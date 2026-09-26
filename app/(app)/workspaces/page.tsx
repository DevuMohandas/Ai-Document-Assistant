import { AppShell } from "@/components/app-shell";
import { PlaceholderPanel } from "@/components/placeholder-panel";

const dummyWorkspaces = [
  { name: "Acme Corp", slug: "acme", documents: 3, active: true },
  { name: "Personal", slug: "personal", documents: 1, active: false },
  { name: "Demo workspace", slug: "demo", documents: 0, active: false },
];

export default function WorkspacesPage() {
  return (
    <AppShell
      title="Workspaces"
      description="Create and switch between isolated knowledge spaces."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">
            Each workspace keeps its own documents and chat history.
          </p>
          <button
            type="button"
            disabled
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-400"
          >
            New workspace
          </button>
        </div>

        <PlaceholderPanel heading="Your workspaces">
          <ul className="mt-2 divide-y divide-zinc-100">
            {dummyWorkspaces.map((ws) => (
              <li
                key={ws.slug}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {ws.name}
                    {ws.active ? (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Active
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {ws.documents} document{ws.documents === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="text-sm text-zinc-400"
                >
                  Switch
                </button>
              </li>
            ))}
          </ul>
        </PlaceholderPanel>
      </div>
    </AppShell>
  );
}
