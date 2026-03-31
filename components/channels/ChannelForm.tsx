"use client";

import { FormEvent, useState } from "react";

export type ChannelFormValues = {
  name: string;
  unit: string;
  dataType: "float" | "int" | "string" | "bool";
};

type ChannelFormProps = {
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: ChannelFormValues) => Promise<void> | void;
};

export function ChannelForm({
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: ChannelFormProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [dataType, setDataType] = useState<ChannelFormValues["dataType"]>("float");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name: name.trim(),
      unit: unit.trim(),
      dataType,
    });
    setName("");
    setUnit("");
    setDataType("float");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-card-foreground">Channel</h3>

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="motor_temp"
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
        maxLength={120}
        required
      />

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          placeholder="degC"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
          maxLength={40}
        />

        <select
          value={dataType}
          onChange={(event) =>
            setDataType(event.target.value as ChannelFormValues["dataType"])
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
        >
          <option value="float">float</option>
          <option value="int">int</option>
          <option value="string">string</option>
          <option value="bool">bool</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
