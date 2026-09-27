import { AppShell } from "@/components/app-shell";
import { DocumentsView } from "@/components/documents/documents-view";
import { PLACEHOLDER_ACTIVE_WORKSPACE } from "@/lib/placeholders";

export default function DocumentsPage() {
  return (
    <AppShell
      title="Documents"
      description="Files ingested for the active workspace."
    >
      <DocumentsView activeWorkspaceName={PLACEHOLDER_ACTIVE_WORKSPACE} />
    </AppShell>
  );
}
