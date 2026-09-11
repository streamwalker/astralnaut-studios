# Change scope and security design

Scope: conversion flow of streamwalker/astralnaut-studios, public comic previews, signup, checkout return, and consented analytics. No external infrastructure or production data was changed.

Data flow: anonymous browser -> public issue loader -> public published free metadata and image paths; authenticated browser -> validated Supabase claims -> entitlement server function -> released paid page paths. Payment card entry stays inside Stripe. Signup email/password go to Supabase. Optional session/campaign events go to the existing Supabase analytics table only with analytics consent.

Principal risks: accidentally exposing draft/paid paths; stale entitlements after sign-out or issue changes; externally controlled return redirects; analytics firing before consent; counting intent as a paid purchase; promising content that is not published. Public preview filtering, constrained reader return validation, entitlement resets, consent gating, explicit event names, and derived availability address the changed scope.

Unverified inherited boundaries: deployed RLS, asset bucket privacy, sandbox-versus-live entitlements, Stripe and Supabase runtime identity, webhook integration, branch protection, dependency vulnerability state, organizational evidence. No high-risk gap is waived and no missing evidence is represented as passing.

Owners: user requested changes for their studio; operational/security approver assignments require confirmation and are not invented here. Applicable baseline/profile versions and unresolved decisions are in reports/applicability.md. External status: none.
