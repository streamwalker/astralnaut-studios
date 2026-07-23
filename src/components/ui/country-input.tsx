import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";
import { forwardRef } from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "list" | "type">;

export const CountryInput = forwardRef<HTMLInputElement, Props>(function CountryInput(props, ref) {
  return (
    <>
      <Input
        {...props}
        ref={ref}
        type="text"
        list="country-list"
        autoComplete="country-name"
        placeholder={props.placeholder ?? "Start typing…"}
      />
      <datalist id="country-list">
        {COUNTRIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
});
