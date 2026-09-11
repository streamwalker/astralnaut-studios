#!/usr/bin/env python3
"""Offline compliance-by-design planning, evidence, and release gate.

This tool does not certify compliance. It validates a repository-local profile,
selects applicable assurance profiles and canonical controls, records hashed
evidence, and emits separate technical-release and assurance-readiness results.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SCRIPT_PATH = Path(__file__).resolve()
SCRIPT_DIR = SCRIPT_PATH.parent
ALLOWED_RISK_TIERS = {"standard", "elevated", "high"}
ALLOWED_PROFILE_STATUSES = {
    "required",
    "targeted",
    "recommended",
    "not_applicable",
    "pending_review",
}
ALLOWED_CONTROL_STATUSES = {
    "not_assessed",
    "planned",
    "implemented",
    "verified",
    "inherited",
    "not_applicable",
    "exception",
}
NON_WAIVABLE_CONTROLS = {
    "AUTHZ-001",
    "SEC-001",
    "NET-001",
    "IOS-001",
    "IOS-002",
    "IOS-004",
}
HEX_64 = re.compile(r"^[0-9a-fA-F]{64}$")
HEX_COMMIT = re.compile(r"^[0-9a-fA-F]{40,64}$")


class GateError(RuntimeError):
    """Raised for deterministic input or repository errors."""


def now_utc() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_date(value: str, field: str) -> date:
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError) as exc:
        raise GateError(f"{field} must be an ISO date (YYYY-MM-DD): {value!r}") from exc


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except FileNotFoundError as exc:
        raise GateError(f"Required file is missing: {path}") from exc
    except json.JSONDecodeError as exc:
        raise GateError(f"Invalid JSON in {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise GateError(f"Expected a JSON object in {path}")
    return data


def atomic_write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink():
        raise GateError(f"Refusing to overwrite symlink: {path}")
    descriptor, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=str(path.parent))
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def atomic_write_json(path: Path, data: Any) -> None:
    atomic_write_text(path, json.dumps(data, indent=2, sort_keys=False) + "\n")


def resource_path(filename: str) -> Path:
    candidates = [
        SCRIPT_DIR / filename,
        SCRIPT_DIR.parent / "references" / filename,
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise GateError(f"Unable to locate {filename}; checked: {', '.join(str(p) for p in candidates)}")


def load_catalog_and_controls() -> tuple[dict[str, Any], dict[str, Any], Path, Path]:
    catalog_path = resource_path("framework-catalog.json")
    controls_path = resource_path("control-baseline.json")
    return load_json(catalog_path), load_json(controls_path), catalog_path, controls_path


def get_profile_value(profile: dict[str, Any], field: str) -> Any:
    if field in profile:
        return profile.get(field)
    facts = profile.get("facts")
    if not isinstance(facts, dict):
        return None
    return facts.get(field)


def evaluate_selector(profile: dict[str, Any], selector: str) -> bool | None:
    if not isinstance(selector, str) or ":" not in selector:
        raise GateError(f"Invalid applicability selector: {selector!r}")
    field, expected = selector.split(":", 1)
    value = get_profile_value(profile, field)
    if value is None:
        return None
    if isinstance(value, list):
        return expected in value
    if isinstance(value, bool):
        return value is (expected.lower() == "true")
    return str(value) == expected


def combine_activation(profile: dict[str, Any], activation: dict[str, Any] | None) -> bool | None:
    activation = activation or {"all": [], "any": []}
    all_selectors = activation.get("all", [])
    any_selectors = activation.get("any", [])
    if not isinstance(all_selectors, list) or not isinstance(any_selectors, list):
        raise GateError("Applicability activation.all and activation.any must be arrays")

    all_values = [evaluate_selector(profile, selector) for selector in all_selectors]
    any_values = [evaluate_selector(profile, selector) for selector in any_selectors]

    if False in all_values:
        all_result: bool | None = False
    elif None in all_values:
        all_result = None
    else:
        all_result = True

    if not any_values:
        any_result: bool | None = True
    elif True in any_values:
        any_result = True
    elif None in any_values:
        any_result = None
    else:
        any_result = False

    if all_result is False or any_result is False:
        return False
    if all_result is None or any_result is None:
        return None
    return True


def validate_framework_decision(profile_id: str, decision: Any, baseline: bool) -> list[str]:
    errors: list[str] = []
    if not isinstance(decision, dict):
        return [f"framework_decisions.{profile_id} must be an object"]
    status = decision.get("status")
    if status not in ALLOWED_PROFILE_STATUSES - {"pending_review"}:
        errors.append(f"framework_decisions.{profile_id}.status is invalid: {status!r}")
    if baseline and status == "not_applicable":
        errors.append(f"Baseline profile {profile_id} cannot be marked not_applicable")
    for field in ("rationale", "owner", "reviewer", "review_date"):
        if not isinstance(decision.get(field), str) or not decision[field].strip():
            errors.append(f"framework_decisions.{profile_id}.{field} is required")
    if decision.get("owner") and decision.get("owner") == decision.get("reviewer"):
        errors.append(f"framework_decisions.{profile_id} owner and reviewer must differ")
    if decision.get("review_date"):
        try:
            parse_date(decision["review_date"], f"framework_decisions.{profile_id}.review_date")
        except GateError as exc:
            errors.append(str(exc))
    return errors


def source_stale(item: dict[str, Any], today: date | None = None) -> bool:
    today = today or date.today()
    verified = parse_date(item.get("verified_on"), f"{item.get('id')}.verified_on")
    freshness = item.get("freshness_days")
    if not isinstance(freshness, int) or freshness <= 0:
        raise GateError(f"{item.get('id')}.freshness_days must be a positive integer")
    return (today - verified).days > freshness


def select_profiles(profile: dict[str, Any], catalog: dict[str, Any]) -> tuple[list[dict[str, Any]], list[str]]:
    decisions = profile.get("framework_decisions", {})
    if not isinstance(decisions, dict):
        decisions = {}
    selections: list[dict[str, Any]] = []
    errors: list[str] = []

    for item in catalog.get("profiles", []):
        profile_id = item["id"]
        baseline = bool(item.get("baseline"))
        match = True if baseline else combine_activation(profile, item.get("activation"))
        decision = decisions.get(profile_id)
        reviewed = decision is not None

        if decision is not None:
            errors.extend(validate_framework_decision(profile_id, decision, baseline))
            status = decision.get("status", "pending_review")
            reason = decision.get("rationale", "Explicit decision is incomplete")
        elif baseline:
            if profile_id in {"soc2", "iso27001"}:
                status = "targeted"
                reason = "Mandatory readiness baseline requested for every platform build"
            elif profile_id == "nist-ssdf":
                status = "required"
                reason = "Mandatory secure-development baseline"
            else:
                status = "recommended"
                reason = "Mandatory baseline mapping selected by this skill"
        elif match is None:
            status = "pending_review"
            reason = "One or more applicability facts are unknown"
        elif match is True:
            if item.get("confirmation") in {"legal", "contract", "assurance_target"}:
                status = "pending_review"
                reason = f"Trigger matched; {item.get('confirmation')} confirmation is required"
            else:
                status = "required"
                reason = "Deterministic applicability trigger matched"
        else:
            status = "not_applicable"
            reason = "Deterministic applicability trigger did not match confirmed facts"

        stale = source_stale(item)
        selections.append(
            {
                "id": profile_id,
                "name": item["name"],
                "version": item["version"],
                "status": status,
                "reason": reason,
                "reviewed": reviewed or baseline or item.get("confirmation") in {"none", "scope"},
                "source_url": item["source_url"],
                "source_verified_on": item["verified_on"],
                "source_stale": stale,
                "licensed_source_required": bool(item.get("licensed_source_required")),
                "external_result": item.get("external_result", "none"),
            }
        )

    unknown_decisions = sorted(set(decisions) - {item["id"] for item in catalog.get("profiles", [])})
    for profile_id in unknown_decisions:
        errors.append(f"framework_decisions contains unknown profile: {profile_id}")
    return selections, errors


def control_applicability(profile: dict[str, Any], control: dict[str, Any]) -> bool | None:
    risk_tier = profile.get("risk_tier")
    risk_tiers = control.get("risk_tiers", [])
    if risk_tier is None:
        risk_result: bool | None = None
    else:
        risk_result = risk_tier in risk_tiers

    control_platforms = control.get("platforms", [])
    project_platforms = get_profile_value(profile, "platforms")
    if "all" in control_platforms:
        platform_result: bool | None = True
    elif project_platforms is None:
        platform_result = None
    elif not isinstance(project_platforms, list):
        platform_result = False
    else:
        platform_result = bool(set(control_platforms) & set(project_platforms))

    activation_result = combine_activation(profile, control.get("activation"))
    results = (risk_result, platform_result, activation_result)
    if False in results:
        return False
    if None in results:
        return None
    return True


def select_controls(profile: dict[str, Any], controls_data: dict[str, Any]) -> list[dict[str, Any]]:
    selections: list[dict[str, Any]] = []
    for control in controls_data.get("controls", []):
        applicability = control_applicability(profile, control)
        state = "applicable" if applicability is True else "pending" if applicability is None else "not_applicable"
        selections.append(
            {
                "id": control["id"],
                "title": control["title"],
                "gate": control["gate"],
                "severity": control["severity"],
                "blocking": bool(control.get("blocking", True)),
                "verification": control["verification"],
                "applicability": state,
                "evidence_required": control.get("evidence", []),
                "framework_profiles": control.get("framework_profiles", []),
            }
        )
    return selections


def validate_catalog_data(catalog: dict[str, Any], controls_data: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    profiles = catalog.get("profiles")
    controls = controls_data.get("controls")
    if not isinstance(profiles, list):
        return ["framework-catalog.json profiles must be an array"]
    if not isinstance(controls, list):
        return ["control-baseline.json controls must be an array"]

    limit = catalog.get("profile_limit")
    if limit != 30 or len(profiles) != 30:
        errors.append(f"Catalog must contain exactly 30 profiles; limit={limit!r}, count={len(profiles)}")

    profile_ids: set[str] = set()
    for item in profiles:
        profile_id = item.get("id")
        if not isinstance(profile_id, str) or not re.fullmatch(r"[a-z0-9-]+", profile_id):
            errors.append(f"Invalid profile id: {profile_id!r}")
            continue
        if profile_id in profile_ids:
            errors.append(f"Duplicate profile id: {profile_id}")
        profile_ids.add(profile_id)
        for field in ("name", "version", "kind", "scope", "source_url", "verified_on"):
            if not isinstance(item.get(field), str) or not item[field].strip():
                errors.append(f"{profile_id}.{field} is required")
        if isinstance(item.get("source_url"), str) and not item["source_url"].startswith("https://"):
            errors.append(f"{profile_id}.source_url must use HTTPS")
        try:
            source_stale(item)
        except GateError as exc:
            errors.append(str(exc))
        activation = item.get("activation", {})
        for key in ("all", "any"):
            values = activation.get(key, []) if isinstance(activation, dict) else []
            if not isinstance(values, list) or any(not isinstance(value, str) or ":" not in value for value in values):
                errors.append(f"{profile_id}.activation.{key} contains an invalid selector")

    for required in ("soc2", "iso27001", "nist-ssdf"):
        match = next((item for item in profiles if item.get("id") == required), None)
        if not match or not match.get("baseline"):
            errors.append(f"Required baseline profile is missing or not baseline: {required}")

    control_ids: set[str] = set()
    covered_profiles: set[str] = set()
    for control in controls:
        control_id = control.get("id")
        if not isinstance(control_id, str) or not re.fullmatch(r"[A-Z]+-[0-9]{3}", control_id):
            errors.append(f"Invalid control id: {control_id!r}")
            continue
        if control_id in control_ids:
            errors.append(f"Duplicate control id: {control_id}")
        control_ids.add(control_id)
        if control.get("gate") not in {"release", "assurance", "both"}:
            errors.append(f"{control_id}.gate is invalid")
        if control.get("severity") not in {"blocker", "high", "medium", "low"}:
            errors.append(f"{control_id}.severity is invalid")
        mappings = control.get("framework_profiles", [])
        if not isinstance(mappings, list):
            errors.append(f"{control_id}.framework_profiles must be an array")
            continue
        unknown = sorted(set(mappings) - profile_ids)
        if unknown:
            errors.append(f"{control_id} maps to unknown profiles: {', '.join(unknown)}")
        covered_profiles.update(mappings)

    uncovered = sorted(profile_ids - covered_profiles)
    if uncovered:
        errors.append(f"Profiles with no canonical control coverage: {', '.join(uncovered)}")
    return errors


def profile_issues(profile: dict[str, Any], require_release_binding: bool = False) -> list[str]:
    issues: list[str] = []
    if profile.get("schema_version") != 1:
        issues.append("security-profile.json schema_version must equal 1")
    if not isinstance(profile.get("project_name"), str) or not profile["project_name"].strip():
        issues.append("project_name is required")
    if profile.get("risk_tier") not in ALLOWED_RISK_TIERS:
        issues.append(f"risk_tier must be one of {sorted(ALLOWED_RISK_TIERS)}")
    facts = profile.get("facts")
    if not isinstance(facts, dict):
        issues.append("facts must be an object")
        facts = {}
    required_fact_arrays = (
        "platforms",
        "product_models",
        "data_types",
        "activities",
        "jurisdictions",
        "customer_types",
        "customer_requirements",
        "assurance_targets",
    )
    for field in required_fact_arrays:
        value = facts.get(field)
        if value is None:
            issues.append(f"facts.{field} is unknown")
        elif not isinstance(value, list) or any(not isinstance(item, str) for item in value):
            issues.append(f"facts.{field} must be an array of strings")
    if not facts.get("platforms"):
        issues.append("facts.platforms must identify at least one platform")
    if profile.get("facts_confirmed") is not True:
        issues.append("facts_confirmed must be true after review")
    licensed_sources = profile.get("licensed_sources", {})
    if not isinstance(licensed_sources, dict):
        issues.append("licensed_sources must be an object")
    owners = profile.get("owners")
    if not isinstance(owners, dict):
        issues.append("owners must be an object")
        owners = {}
    for role in ("scope", "security", "release"):
        if not isinstance(owners.get(role), str) or not owners[role].strip():
            issues.append(f"owners.{role} is required")
    if require_release_binding:
        if not isinstance(profile.get("repository"), str) or not profile["repository"].strip():
            issues.append("repository is required for gating")
        if not isinstance(profile.get("release_id"), str) or not profile["release_id"].strip():
            issues.append("release_id is required for gating")
        if not isinstance(profile.get("commit"), str) or not HEX_COMMIT.fullmatch(profile["commit"]):
            issues.append("commit must be a full 40-64 character hexadecimal digest")
        if not isinstance(profile.get("artifact_sha256"), str) or not HEX_64.fullmatch(profile["artifact_sha256"]):
            issues.append("artifact_sha256 must be a 64-character SHA-256 digest")
    external_status = profile.get("external_status", "none")
    if external_status != "none" and not isinstance(external_status, list):
        issues.append("external_status must be 'none' or an array of externally issued result records")
    if isinstance(external_status, list):
        for index, result in enumerate(external_status):
            if not isinstance(result, dict):
                issues.append(f"external_status[{index}] must be an object")
                continue
            for field in ("profile_id", "result", "issuer", "identifier", "scope", "issued_on", "evidence_uri", "sha256"):
                if not isinstance(result.get(field), str) or not result[field].strip():
                    issues.append(f"external_status[{index}].{field} is required")
            if result.get("sha256") and not HEX_64.fullmatch(result["sha256"]):
                issues.append(f"external_status[{index}].sha256 must be a SHA-256 digest")
            if result.get("issued_on"):
                try:
                    parse_date(result["issued_on"], f"external_status[{index}].issued_on")
                except GateError as exc:
                    issues.append(str(exc))
            if result.get("expires_on"):
                try:
                    if parse_date(result["expires_on"], f"external_status[{index}].expires_on") < date.today():
                        issues.append(f"external_status[{index}] has expired")
                except GateError as exc:
                    issues.append(str(exc))
            if result.get("profile_id") == "soc2" and "certif" in str(result.get("result", "")).lower():
                issues.append("SOC 2 is an attestation/report, not a certification")
    return issues


def root_paths(root: Path) -> dict[str, Path]:
    security = root / ".security"
    return {
        "security": security,
        "tooling": security / "tooling",
        "profile": security / "security-profile.json",
        "status": security / "control-status.json",
        "lock": security / "baseline.lock.json",
        "evidence_manifest": security / "evidence" / "manifest.json",
        "reports": security / "reports",
    }


def verify_repository_lock(paths: dict[str, Path]) -> list[str]:
    errors: list[str] = []
    try:
        lock = load_json(paths["lock"])
    except GateError as exc:
        return [str(exc)]
    checks = (
        ("catalog_sha256", paths["tooling"] / "framework-catalog.json"),
        ("baseline_sha256", paths["tooling"] / "control-baseline.json"),
        ("gate_sha256", paths["tooling"] / "compliance_gate.py"),
    )
    for field, path in checks:
        expected = lock.get(field)
        if not isinstance(expected, str) or not HEX_64.fullmatch(expected):
            errors.append(f"baseline.lock.json {field} is missing or invalid")
            continue
        if not path.is_file():
            errors.append(f"Locked tooling file is missing: {path}")
            continue
        actual = sha256_file(path)
        if actual != expected.lower():
            errors.append(f"Locked tooling hash mismatch: {path.name}")
    return errors


def validate_licensed_source(profile_id: str, record: Any) -> list[str]:
    if not isinstance(record, dict):
        return [f"Selected licensed profile {profile_id} requires an authorized source record"]
    errors: list[str] = []
    for field in ("edition", "source_locator", "sha256", "owner", "reviewer", "reviewed_on"):
        if not isinstance(record.get(field), str) or not record[field].strip():
            errors.append(f"licensed_sources.{profile_id}.{field} is required")
    if record.get("sha256") and not HEX_64.fullmatch(record["sha256"]):
        errors.append(f"licensed_sources.{profile_id}.sha256 must be a SHA-256 digest")
    if record.get("owner") and record.get("owner") == record.get("reviewer"):
        errors.append(f"licensed_sources.{profile_id} owner and reviewer must differ")
    if record.get("reviewed_on"):
        try:
            parse_date(record["reviewed_on"], f"licensed_sources.{profile_id}.reviewed_on")
        except GateError as exc:
            errors.append(str(exc))
    return errors


def safe_copy(source: Path, destination: Path, force: bool) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_symlink():
        raise GateError(f"Refusing to overwrite symlink: {destination}")
    if destination.exists():
        if sha256_file(source) == sha256_file(destination):
            return
        if not force:
            raise GateError(f"Refusing to overwrite changed file without --force: {destination}")
    shutil.copy2(source, destination)


def default_profile(project_name: str, platforms: list[str], risk_tier: str) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "project_name": project_name,
        "repository": None,
        "release_id": None,
        "commit": None,
        "artifact_sha256": None,
        "risk_tier": risk_tier,
        "facts_confirmed": False,
        "owners": {"scope": None, "security": None, "release": None},
        "facts": {
            "platforms": sorted(set(platforms)),
            "product_models": None,
            "data_types": None,
            "activities": None,
            "jurisdictions": None,
            "customer_types": None,
            "customer_requirements": None,
            "assurance_targets": ["soc2", "iso27001"],
        },
        "framework_decisions": {},
        "licensed_sources": {},
        "external_status": "none",
    }


def default_control_status(project_name: str, controls_data: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": 1,
        "project_name": project_name,
        "updated_at": now_utc(),
        "controls": {
            control["id"]: {
                "status": "not_assessed",
                "owner": None,
                "reviewer": None,
                "rationale": None,
                "notes": None,
                "evidence": [],
            }
            for control in controls_data.get("controls", [])
        },
    }


def install_repository(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    if not root.exists() or not root.is_dir():
        raise GateError(f"Project root must be an existing directory: {root}")
    catalog, controls_data, catalog_source, controls_source = load_catalog_and_controls()
    validation_errors = validate_catalog_data(catalog, controls_data)
    if validation_errors:
        raise GateError("Skill data validation failed:\n- " + "\n- ".join(validation_errors))
    paths = root_paths(root)
    paths["tooling"].mkdir(parents=True, exist_ok=True)
    paths["reports"].mkdir(parents=True, exist_ok=True)
    paths["evidence_manifest"].parent.mkdir(parents=True, exist_ok=True)

    safe_copy(SCRIPT_PATH, paths["tooling"] / "compliance_gate.py", args.force)
    safe_copy(catalog_source, paths["tooling"] / "framework-catalog.json", args.force)
    safe_copy(controls_source, paths["tooling"] / "control-baseline.json", args.force)

    if not paths["profile"].exists():
        atomic_write_json(paths["profile"], default_profile(args.project_name, args.platform, args.risk_tier))
    elif args.force_profile:
        atomic_write_json(paths["profile"], default_profile(args.project_name, args.platform, args.risk_tier))

    if not paths["status"].exists():
        atomic_write_json(paths["status"], default_control_status(args.project_name, controls_data))
    elif args.force_profile:
        atomic_write_json(paths["status"], default_control_status(args.project_name, controls_data))

    lock = {
        "schema_version": 1,
        "locked_at": now_utc(),
        "catalog_id": catalog.get("catalog_id"),
        "catalog_verified_on": catalog.get("verified_on"),
        "catalog_sha256": sha256_file(paths["tooling"] / "framework-catalog.json"),
        "baseline_id": controls_data.get("baseline_id"),
        "baseline_sha256": sha256_file(paths["tooling"] / "control-baseline.json"),
        "gate_sha256": sha256_file(paths["tooling"] / "compliance_gate.py"),
    }
    if not paths["lock"].exists() or args.force:
        atomic_write_json(paths["lock"], lock)

    if not paths["evidence_manifest"].exists():
        atomic_write_json(paths["evidence_manifest"], {"schema_version": 1, "updated_at": now_utc(), "evidence": []})
    gitignore = paths["security"] / ".gitignore"
    if not gitignore.exists():
        atomic_write_text(gitignore, "evidence/*\n!evidence/manifest.json\n*.secret\n*.unredacted\n")

    print(f"Installed repository-local compliance gate in {paths['security']}")
    print(f"Complete {paths['profile']} and run: python3 .security/tooling/compliance_gate.py plan --root . --write")
    return 0


def markdown_escape(value: Any) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def render_applicability_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Applicability Decision Record",
        "",
        f"Generated: {report['generated_at']}",
        "",
        "## Profile issues",
        "",
    ]
    issues = report.get("profile_issues", []) + report.get("decision_errors", [])
    lines.extend([f"- {issue}" for issue in issues] or ["- None detected."])
    lines.extend(
        [
            "",
            "## Framework profiles",
            "",
            "| Profile | Version | Status | Reviewed | Source fresh | Reason |",
            "|---|---|---|---:|---:|---|",
        ]
    )
    for item in report["profiles"]:
        lines.append(
            "| {name} | {version} | {status} | {reviewed} | {fresh} | {reason} |".format(
                name=markdown_escape(item["name"]),
                version=markdown_escape(item["version"]),
                status=item["status"],
                reviewed="yes" if item["reviewed"] else "no",
                fresh="no" if item["source_stale"] else "yes",
                reason=markdown_escape(item["reason"]),
            )
        )
    return "\n".join(lines) + "\n"


def render_control_plan_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Canonical Control Plan",
        "",
        f"Generated: {report['generated_at']}",
        "",
        "| Control | Title | Gate | Severity | Applicability | Verification |",
        "|---|---|---|---|---|---|",
    ]
    for control in report["controls"]:
        lines.append(
            f"| {control['id']} | {markdown_escape(control['title'])} | {control['gate']} | "
            f"{control['severity']} | {control['applicability']} | {control['verification']} |"
        )
    lines.extend(["", "Framework mappings are directional coverage aids, not proof of conformity.", ""])
    return "\n".join(lines)


def build_plan(root: Path) -> dict[str, Any]:
    paths = root_paths(root)
    profile = load_json(paths["profile"])
    catalog, controls_data, _, _ = load_catalog_and_controls()
    data_errors = validate_catalog_data(catalog, controls_data)
    profiles, decision_errors = select_profiles(profile, catalog)
    controls = select_controls(profile, controls_data)
    return {
        "schema_version": 1,
        "generated_at": now_utc(),
        "project_name": profile.get("project_name"),
        "profile_issues": profile_issues(profile, require_release_binding=False),
        "decision_errors": data_errors + decision_errors,
        "profiles": profiles,
        "controls": controls,
    }


def plan_repository(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    report = build_plan(root)
    if args.write:
        paths = root_paths(root)
        atomic_write_json(paths["reports"] / "applicability.json", report)
        atomic_write_text(paths["reports"] / "applicability.md", render_applicability_markdown(report))
        atomic_write_text(paths["reports"] / "control-plan.md", render_control_plan_markdown(report))
        print(f"Wrote applicability and control plan reports to {paths['reports']}")
    else:
        print(json.dumps(report, indent=2))
    return 0


def resolve_evidence_path(root: Path, value: str) -> Path:
    candidate = Path(value)
    if not candidate.is_absolute():
        candidate = root / candidate
    resolved = candidate.resolve(strict=True)
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        raise GateError(f"Evidence must remain inside the project root: {resolved}") from exc
    if not resolved.is_file():
        raise GateError(f"Evidence must be a file: {resolved}")
    return resolved


def rebuild_evidence_manifest(paths: dict[str, Path], status_data: dict[str, Any]) -> None:
    evidence: list[dict[str, Any]] = []
    controls = status_data.get("controls", {})
    if isinstance(controls, dict):
        for control_id, record in controls.items():
            if not isinstance(record, dict):
                continue
            for item in record.get("evidence", []):
                if isinstance(item, dict):
                    copy = dict(item)
                    copy.setdefault("control_id", control_id)
                    evidence.append(copy)
    atomic_write_json(
        paths["evidence_manifest"],
        {"schema_version": 1, "updated_at": now_utc(), "evidence": evidence},
    )


def record_control(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    paths = root_paths(root)
    profile = load_json(paths["profile"])
    status_data = load_json(paths["status"])
    _, controls_data, _, _ = load_catalog_and_controls()
    controls_by_id = {item["id"]: item for item in controls_data.get("controls", [])}
    if args.control not in controls_by_id:
        raise GateError(f"Unknown control: {args.control}")
    if args.status not in ALLOWED_CONTROL_STATUSES:
        raise GateError(f"Invalid control status: {args.status}")
    if not isinstance(args.owner, str) or not args.owner.strip():
        raise GateError("--owner is required")

    status_controls = status_data.setdefault("controls", {})
    record = status_controls.setdefault(args.control, {})
    evidence_items: list[dict[str, Any]] = []
    for evidence_arg in args.evidence or []:
        evidence_path = resolve_evidence_path(root, evidence_arg)
        digest = sha256_file(evidence_path)
        relative = evidence_path.relative_to(root).as_posix()
        evidence_items.append(
            {
                "evidence_id": f"EV-{args.control}-{digest[:12]}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
                "control_id": args.control,
                "profile_refs": controls_by_id[args.control].get("framework_profiles", []),
                "repository": profile.get("repository"),
                "commit": profile.get("commit"),
                "release_id": profile.get("release_id"),
                "artifact_sha256": profile.get("artifact_sha256"),
                "environment": args.environment,
                "path": relative,
                "sha256": digest,
                "tool": args.tool,
                "tool_version": args.tool_version,
                "ruleset": args.ruleset,
                "result": args.result,
                "collected_at": now_utc(),
                "collector": args.owner,
                "provenance": args.provenance,
                "classification": args.classification,
                "redacted": bool(args.redacted),
                "valid_until": args.valid_until,
            }
        )

    if args.external_uri:
        if not args.digest or not HEX_64.fullmatch(args.digest):
            raise GateError("--digest must be a SHA-256 value for external evidence")
        if not args.reviewer:
            raise GateError("--reviewer is required for external evidence")
        evidence_items.append(
            {
                "evidence_id": f"EV-{args.control}-{args.digest[:12]}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
                "control_id": args.control,
                "profile_refs": controls_by_id[args.control].get("framework_profiles", []),
                "repository": profile.get("repository"),
                "uri": args.external_uri,
                "sha256": args.digest.lower(),
                "tool": args.tool,
                "tool_version": args.tool_version,
                "ruleset": args.ruleset,
                "result": args.result,
                "collected_at": now_utc(),
                "collector": args.owner,
                "reviewer": args.reviewer,
                "provenance": "third_party",
                "classification": args.classification,
                "redacted": bool(args.redacted),
                "valid_until": args.valid_until,
            }
        )

    if args.status in {"verified", "inherited"} and not evidence_items:
        raise GateError(f"Status {args.status} requires evidence")
    if args.status == "not_applicable":
        if not args.rationale or not args.reviewer:
            raise GateError("not_applicable requires --rationale and --reviewer")
        if args.owner == args.reviewer:
            raise GateError("not_applicable owner and reviewer must differ")
    if args.status == "exception":
        if args.control in NON_WAIVABLE_CONTROLS:
            raise GateError(f"Control {args.control} is non-waivable")
        if not args.rationale or not args.approver or not args.expires or not args.compensating_control:
            raise GateError("exception requires --rationale, --approver, --expires, and --compensating-control")
        if args.owner == args.approver:
            raise GateError("exception owner and approver must differ")
        if parse_date(args.expires, "expires") <= date.today():
            raise GateError("exception expiration must be in the future")

    previous_evidence = record.get("evidence", []) if args.append else []
    record.update(
        {
            "status": args.status,
            "owner": args.owner,
            "reviewer": args.reviewer,
            "review_date": args.review_date or (date.today().isoformat() if args.status == "not_applicable" else None),
            "rationale": args.rationale,
            "notes": args.notes,
            "evidence": previous_evidence + evidence_items,
        }
    )
    if args.status == "exception":
        record["exception"] = {
            "approver": args.approver,
            "expires": args.expires,
            "review_date": args.review_date or date.today().isoformat(),
            "compensating_controls": args.compensating_control,
        }
    else:
        record.pop("exception", None)
    status_data["updated_at"] = now_utc()
    atomic_write_json(paths["status"], status_data)
    rebuild_evidence_manifest(paths, status_data)
    print(f"Recorded {args.status} for {args.control}")
    return 0


def validate_evidence_item(root: Path, profile: dict[str, Any], item: Any, inherited: bool) -> list[str]:
    errors: list[str] = []
    if not isinstance(item, dict):
        return ["Evidence entry must be an object"]
    digest = item.get("sha256")
    if not isinstance(digest, str) or not HEX_64.fullmatch(digest):
        errors.append("Evidence SHA-256 is missing or invalid")
    if item.get("result") != "pass":
        errors.append(f"Evidence result is not pass: {item.get('result')!r}")
    for field in ("evidence_id", "tool", "tool_version", "collected_at", "collector", "provenance"):
        if not isinstance(item.get(field), str) or not item[field].strip():
            errors.append(f"Evidence {field} is required")
    if item.get("valid_until"):
        try:
            if parse_date(item["valid_until"], "evidence.valid_until") < date.today():
                errors.append("Evidence has expired")
        except GateError as exc:
            errors.append(str(exc))

    if item.get("path"):
        try:
            evidence_path = resolve_evidence_path(root, item["path"])
            if isinstance(digest, str) and HEX_64.fullmatch(digest) and sha256_file(evidence_path) != digest.lower():
                errors.append(f"Evidence hash mismatch: {item['path']}")
        except (GateError, OSError) as exc:
            errors.append(str(exc))
        if not inherited:
            bindings = {
                "repository": profile.get("repository"),
                "commit": profile.get("commit"),
                "release_id": profile.get("release_id"),
                "artifact_sha256": profile.get("artifact_sha256"),
            }
            for field, expected in bindings.items():
                if item.get(field) != expected:
                    errors.append(f"Evidence {field} does not match the current release")
    elif item.get("uri"):
        if item.get("provenance") != "third_party":
            errors.append("External evidence must use third_party provenance")
        if not isinstance(item.get("reviewer"), str) or not item["reviewer"].strip():
            errors.append("External evidence requires a reviewer")
    else:
        errors.append("Evidence requires path or secure uri")
    return errors


def validate_control_record(
    root: Path,
    profile: dict[str, Any],
    control: dict[str, Any],
    record: Any,
) -> tuple[bool, str, str]:
    control_id = control["id"]
    if not isinstance(record, dict):
        return False, "assessment", "Control status record is missing"
    status = record.get("status")
    if status not in ALLOWED_CONTROL_STATUSES:
        return False, "assessment", f"Invalid status: {status!r}"
    if status == "not_assessed":
        return False, "assessment", "Control is not assessed"
    if status in {"planned", "implemented"}:
        return False, "gap", f"Control is only {status}"
    if status in {"verified", "inherited"}:
        evidence = record.get("evidence", [])
        if not isinstance(evidence, list) or not evidence:
            return False, "assessment", f"{status} control has no evidence"
        evidence_errors: list[str] = []
        for item in evidence:
            evidence_errors.extend(validate_evidence_item(root, profile, item, inherited=status == "inherited"))
        if evidence_errors:
            return False, "assessment", "; ".join(sorted(set(evidence_errors)))
        if status == "inherited" and (not record.get("reviewer") or record.get("owner") == record.get("reviewer")):
            return False, "gap", "Inherited control requires a separate reviewer"
        return True, "pass", status
    if status == "not_applicable":
        for field in ("rationale", "owner", "reviewer", "review_date"):
            if not isinstance(record.get(field), str) or not record[field].strip():
                return False, "gap", f"not_applicable requires {field}"
        if record.get("owner") == record.get("reviewer"):
            return False, "gap", "not_applicable owner and reviewer must differ"
        try:
            parse_date(record["review_date"], f"{control_id}.review_date")
        except GateError as exc:
            return False, "gap", str(exc)
        return True, "pass", status
    if status == "exception":
        if control_id in NON_WAIVABLE_CONTROLS:
            return False, "gap", "Control is non-waivable"
        exception = record.get("exception")
        if not isinstance(exception, dict):
            return False, "gap", "Exception details are missing"
        for field in ("approver", "expires", "review_date", "compensating_controls"):
            if not exception.get(field):
                return False, "gap", f"Exception requires {field}"
        if not record.get("owner") or record.get("owner") == exception.get("approver"):
            return False, "gap", "Exception owner and approver must be present and differ"
        try:
            if parse_date(exception["expires"], f"{control_id}.exception.expires") <= date.today():
                return False, "gap", "Exception is expired"
        except GateError as exc:
            return False, "gap", str(exc)
        if not isinstance(record.get("evidence"), list) or not record["evidence"]:
            return False, "assessment", "Exception requires compensating-control evidence"
        evidence_errors: list[str] = []
        for item in record["evidence"]:
            evidence_errors.extend(validate_evidence_item(root, profile, item, inherited=False))
        if evidence_errors:
            return False, "assessment", "; ".join(sorted(set(evidence_errors)))
        return True, "pass", status
    return False, "assessment", f"Unhandled status: {status!r}"


def gate_repository(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    paths = root_paths(root)
    profile = load_json(paths["profile"])
    status_data = load_json(paths["status"])
    catalog, controls_data, _, _ = load_catalog_and_controls()
    data_errors = validate_catalog_data(catalog, controls_data)
    profiles, decision_errors = select_profiles(profile, catalog)
    controls = select_controls(profile, controls_data)
    control_records = status_data.get("controls", {})
    if not isinstance(control_records, dict):
        control_records = {}

    blockers: list[dict[str, str]] = []
    warnings: list[str] = []
    for issue in (
        data_errors
        + decision_errors
        + verify_repository_lock(paths)
        + profile_issues(profile, require_release_binding=True)
    ):
        blockers.append({"category": "assessment", "subject": "profile", "message": issue})

    if args.mode == "assurance":
        licensed_sources = profile.get("licensed_sources", {})
        if not isinstance(licensed_sources, dict):
            licensed_sources = {}
        for item in profiles:
            if item["status"] in {"required", "targeted", "recommended"} and item["licensed_source_required"]:
                for issue in validate_licensed_source(item["id"], licensed_sources.get(item["id"])):
                    blockers.append(
                        {
                            "category": "assessment",
                            "subject": f"profile:{item['id']}",
                            "message": issue,
                        }
                    )

    for item in profiles:
        if item["status"] == "pending_review":
            blockers.append(
                {"category": "assessment", "subject": f"profile:{item['id']}", "message": item["reason"]}
            )
        if args.mode == "assurance" and item["status"] == "not_applicable" and not item["reviewed"]:
            blockers.append(
                {
                    "category": "gap",
                    "subject": f"profile:{item['id']}",
                    "message": "Not-applicable decision lacks explicit owner/reviewer approval",
                }
            )
        if item["status"] in {"required", "targeted", "recommended"} and item["source_stale"]:
            category = "assessment" if args.mode == "assurance" else "warning"
            message = f"Source metadata is stale: {item['version']}"
            if category == "assessment":
                blockers.append({"category": category, "subject": f"profile:{item['id']}", "message": message})
            else:
                warnings.append(f"{item['id']}: {message}")

    applicable_count = 0
    passed_count = 0
    for control in controls:
        in_mode = args.mode == "assurance" or control["gate"] in {"release", "both"}
        if not in_mode:
            continue
        if control["applicability"] == "not_applicable":
            continue
        if control["applicability"] == "pending":
            blockers.append(
                {
                    "category": "assessment",
                    "subject": f"control:{control['id']}",
                    "message": "Control applicability is unresolved",
                }
            )
            continue
        applicable_count += 1
        passed, category, message = validate_control_record(
            root,
            profile,
            control,
            control_records.get(control["id"]),
        )
        if passed:
            passed_count += 1
        elif control.get("blocking", True):
            blockers.append(
                {
                    "category": category,
                    "subject": f"control:{control['id']}",
                    "message": message,
                }
            )

    has_assessment_error = any(item["category"] == "assessment" for item in blockers)
    if args.mode == "release":
        decision = "not_assessed" if has_assessment_error else "fail" if blockers else "pass"
        decision_key = "technical_release_gate"
    else:
        decision = "not_assessed" if has_assessment_error else "not_ready" if blockers else "ready"
        decision_key = "assurance_readiness"

    report = {
        "schema_version": 1,
        "generated_at": now_utc(),
        "project_name": profile.get("project_name"),
        "repository": profile.get("repository"),
        "commit": profile.get("commit"),
        "release_id": profile.get("release_id"),
        "artifact_sha256": profile.get("artifact_sha256"),
        "mode": args.mode,
        decision_key: decision,
        "external_status": profile.get("external_status", "none"),
        "applicable_controls": applicable_count,
        "passed_controls": passed_count,
        "blockers": blockers,
        "warnings": warnings,
        "selected_profiles": [
            {"id": item["id"], "version": item["version"], "status": item["status"]}
            for item in profiles
            if item["status"] != "not_applicable"
        ],
    }
    report_name = "technical-release-gate" if args.mode == "release" else "assurance-readiness"
    atomic_write_json(paths["reports"] / f"{report_name}.json", report)
    lines = [
        f"# {report_name.replace('-', ' ').title()}",
        "",
        f"Decision: **{decision}**",
        "",
        f"Release: {profile.get('release_id')}",
        f"Commit: {profile.get('commit')}",
        f"Artifact SHA-256: {profile.get('artifact_sha256')}",
        "",
        "## Blockers",
        "",
    ]
    lines.extend(
        [f"- `{item['subject']}` — {item['message']}" for item in blockers]
        or ["- None."]
    )
    if warnings:
        lines.extend(["", "## Warnings", ""] + [f"- {warning}" for warning in warnings])
    atomic_write_text(paths["reports"] / f"{report_name}.md", "\n".join(lines) + "\n")
    print(json.dumps(report, indent=2))
    return 0 if decision in {"pass", "ready"} else 1


def validate_command(_: argparse.Namespace) -> int:
    catalog, controls_data, catalog_path, controls_path = load_catalog_and_controls()
    errors = validate_catalog_data(catalog, controls_data)
    if errors:
        print("Validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(
        f"Validated {len(catalog['profiles'])} profiles and {len(controls_data['controls'])} controls "
        f"from {catalog_path} and {controls_path}"
    )
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Compliance-by-design profile selection, evidence integrity, and release gating"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate", help="Validate the bundled catalog and control baseline")
    validate_parser.set_defaults(func=validate_command)

    install_parser = subparsers.add_parser("install", help="Install a pinned repository-local gate")
    install_parser.add_argument("--root", required=True)
    install_parser.add_argument("--project-name", required=True)
    install_parser.add_argument("--platform", action="append", required=True)
    install_parser.add_argument("--risk-tier", choices=sorted(ALLOWED_RISK_TIERS), default="standard")
    install_parser.add_argument("--force", action="store_true", help="Replace changed vendored tooling and lock")
    install_parser.add_argument(
        "--force-profile",
        action="store_true",
        help="Replace profile and control status templates; destructive to recorded status",
    )
    install_parser.set_defaults(func=install_repository)

    plan_parser = subparsers.add_parser("plan", help="Select profiles and controls")
    plan_parser.add_argument("--root", required=True)
    plan_parser.add_argument("--write", action="store_true")
    plan_parser.set_defaults(func=plan_repository)

    record_parser = subparsers.add_parser("record", help="Record control status and hashed evidence")
    record_parser.add_argument("--root", required=True)
    record_parser.add_argument("--control", required=True)
    record_parser.add_argument("--status", required=True, choices=sorted(ALLOWED_CONTROL_STATUSES))
    record_parser.add_argument("--owner", required=True)
    record_parser.add_argument("--reviewer")
    record_parser.add_argument("--approver")
    record_parser.add_argument("--rationale")
    record_parser.add_argument("--notes")
    record_parser.add_argument("--evidence", action="append")
    record_parser.add_argument("--external-uri")
    record_parser.add_argument("--digest")
    record_parser.add_argument("--tool", default="manual-review")
    record_parser.add_argument("--tool-version", default="1")
    record_parser.add_argument("--ruleset", default="project-pinned")
    record_parser.add_argument("--result", choices=["pass", "fail", "error"], default="pass")
    record_parser.add_argument("--environment", default="release")
    record_parser.add_argument("--provenance", choices=["observed", "self_asserted", "third_party"], default="observed")
    record_parser.add_argument("--classification", default="internal")
    record_parser.add_argument("--redacted", action="store_true")
    record_parser.add_argument("--valid-until")
    record_parser.add_argument("--expires")
    record_parser.add_argument("--review-date")
    record_parser.add_argument("--compensating-control", action="append")
    record_parser.add_argument("--append", action="store_true")
    record_parser.set_defaults(func=record_control)

    gate_parser = subparsers.add_parser("gate", help="Run the technical release or assurance readiness gate")
    gate_parser.add_argument("--root", required=True)
    gate_parser.add_argument("--mode", required=True, choices=["release", "assurance"])
    gate_parser.set_defaults(func=gate_repository)
    return parser


def main(argv: Iterable[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)
    try:
        return int(args.func(args))
    except GateError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("Interrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
