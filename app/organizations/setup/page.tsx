"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { trpc } from "@/lib/trpc";

const ORG_TYPES = [
  { id: "personal", label: "Personal" },
  { id: "startup", label: "Startup" },
  { id: "educational", label: "Educational" },
  { id: "company", label: "Company" },
] as const;

export default function OrganizationSetupPage() {
  const router = useRouter();
  const organizationsQuery = trpc.organizations.list.useQuery();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ORG_TYPES)[number]["id"]>(
    ORG_TYPES[0].id,
  );
  const [currentTypeLabel, setCurrentTypeLabel] = useState<string>(
    ORG_TYPES[0].label,
  );
  const createMutation = trpc.organizations.create.useMutation({
    onSuccess: () => {
      router.replace("/");
      router.refresh();
    },
  });

  useEffect(() => {
    if (
      organizationsQuery.isSuccess &&
      organizationsQuery.data.length > 0
    ) {
      router.replace("/");
    }
  }, [organizationsQuery.data, organizationsQuery.isSuccess, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    createMutation.mutate({ name: name.trim(), type });
  }

  return (
    <PageLayout
      title="Create your organization"
      description="Before you can explore datasets or run experiments, create the organization that owns your workspace."
    >
      <div className="max-w-3xl rounded-2xl border border-border bg-card/60 p-6 shadow-lg shadow-black/20">
        <p className="text-sm text-muted-foreground">
          Organizations group clusters, datasets and channels. Only members
          of an organization may access what it owns.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <label className="block space-y-2 text-sm">
            <span className="text-muted-foreground">Organization name</span>
            <input
              placeholder="e.g. Orion Labs"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-input focus:ring-1 focus:ring-ring"
              required
            />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-muted-foreground">
              Type
            </legend>
            <p className="text-xs text-muted-foreground">
              Choose the option that best matches how you plan to use Xpectra.
            </p>
            <div className="flex flex-wrap gap-3">
              {ORG_TYPES.map((orgType) => (
                <label
                  key={orgType.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 text-sm transition ${
                    type === orgType.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="organization-type"
                    value={orgType.id}
                    checked={type === orgType.id}
                    onChange={() => {
                      setType(orgType.id);
                      setCurrentTypeLabel(orgType.label);
                    }}
                    className="sr-only"
                  />
                  <span>{orgType.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createMutation.isPending
                ? `Creating ${currentTypeLabel}...`
                : "Create organization"}
            </button>
            {createMutation.error && (
              <p className="text-sm text-destructive-foreground">
                {createMutation.error.message}
              </p>
            )}
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
