import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const mainNavItems = [
  { href: "/dashboard", label: "Chat" },
  { href: "/documents", label: "Documents" },
  { href: "/tool-activity", label: "Tool Activity" },
  { href: "/workspaces", label: "Workspaces" },
] as const;

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  description?: string;
};

export function AppShell({ children, title, description }: AppShellProps) {
  return (
    <div className="flex min-h-full bg-zinc-50 text-zinc-900">
      <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white md:flex md:flex-col">
        <div className="border-b border-zinc-200 px-4 py-4">
          <Link href="/dashboard" className="block">
            <span className="text-sm font-semibold tracking-tight">
              Document Assistant
            </span>
          </Link>
          <WorkspaceSwitcher
            id="workspace-sidebar"
            className="mt-3 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-sm text-zinc-900"
          />
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <Link
            href="/profile"
            className="block rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            Profile
          </Link>
          <LogoutButton
            className="mt-0.5 block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-60"
          >
            Logout
          </LogoutButton>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {title}
            </h1>
            {description ? (
              <p className="truncate text-sm text-zinc-500">{description}</p>
            ) : null}
          </div>
          <div className="mt-3 md:hidden">
            <WorkspaceSwitcher
              id="workspace-mobile-header"
              className="w-full max-w-xs rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm"
            />
          </div>
        </header>

        <nav
          className="flex flex-wrap gap-1 border-b border-zinc-200 bg-white px-3 py-2 md:hidden"
          aria-label="Mobile"
        >
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/profile"
            className="shrink-0 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600"
          >
            Profile
          </Link>
          <LogoutButton
            className="shrink-0 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 disabled:opacity-60"
          >
            Logout
          </LogoutButton>
        </nav>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
