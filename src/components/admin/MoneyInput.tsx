import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/lib/parse-money";
import type { ComponentProps } from "react";

type MoneyInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange" | "inputMode" | "required"> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  allowEmpty?: boolean;
};

export function MoneyInput({ value, onChange, allowEmpty = false, onBlur, onFocus, ...props }: MoneyInputProps) {
  const [text, setText] = useState(() => formatMoneyInput(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatMoneyInput(value));
  }, [value, focused]);

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw.trim() === "") {
          if (allowEmpty) onChange(undefined);
          return;
        }
        const n = parseMoneyInput(raw);
        if (n !== null) onChange(n);
      }}
      onBlur={(e) => {
        setFocused(false);
        setText(formatMoneyInput(value));
        onBlur?.(e);
      }}
    />
  );
}
