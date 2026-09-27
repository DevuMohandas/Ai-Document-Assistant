import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

export default function ProfilePage() {
  return (
    <AppShell
      title="Profile"
      description="Account details and session."
    >
      <div className="mx-auto max-w-lg space-y-6">
        <PlaceholderPanel heading="Account (placeholder)">
          <dl className="mt-2 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Name</dt>
              <dd className="text-zinc-900">Demo User</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Email</dt>
              <dd className="text-zinc-900">demo@example.com</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Member since</dt>
              <dd className="text-zinc-900">Sep 2026</dd>
            </div>
          </dl>
        </PlaceholderPanel>

        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Log out (returns to login)
        </Link>
      </div>
    </AppShell>
  );
}
