import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { PlaceholderPanel } from "@/components/placeholder-panel";
import { createClient } from "@/lib/supabase/server";

function formatMemberSince(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function displayName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name);
  if (fromMeta) return fromMeta;
  if (user.email) return user.email.split("@")[0];
  return "—";
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <AppShell title="Profile" description="Account details and session.">
      <div className="mx-auto max-w-lg space-y-6">
        <PlaceholderPanel heading="Account">
          <dl className="mt-2 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Name</dt>
              <dd className="text-right text-zinc-900">{displayName(user)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Email</dt>
              <dd className="text-right text-zinc-900">{user.email ?? "—"}</dd>
            </div>
            {/* <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">User ID</dt>
              <dd className="truncate text-right font-mono text-xs text-zinc-700">
                {user.id}
              </dd>
            </div> */}
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Member since</dt>
              <dd className="text-right text-zinc-900">
                {user.created_at ? formatMemberSince(user.created_at) : "—"}
              </dd>
            </div>
          </dl>
        </PlaceholderPanel>

        <LogoutButton
          className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
        >
          Log out
        </LogoutButton>
      </div>
    </AppShell>
  );
}
