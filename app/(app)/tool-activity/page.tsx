import { AppShell } from "@/components/app-shell";
import { ToolActivityTable } from "@/components/tool-activity/tool-activity-table";
import { PLACEHOLDER_ACTIVE_WORKSPACE } from "@/lib/placeholders";
import type { ToolActivityRow } from "@/lib/types/tool-activity";

const SEED_TOOL_ACTIVITY: ToolActivityRow[] = [
  {
    id: "tool-1",
    toolName: "save_task",
    description: "Created task: Review contract",
    occurredAt: "25 Sep 2026, 3:30 PM",
    status: "Success",
  },
  {
    id: "tool-2",
    toolName: "send_notification",
    description: "Sent document summary",
    occurredAt: "24 Sep 2026, 11:15 AM",
    status: "Success",
  },
];

export default function ToolActivityPage() {
  return (
    <AppShell
      title="Tool Activity"
      description="Actions performed by the assistant in this workspace."
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <p className="text-sm text-zinc-600">
          Workspace:{" "}
          <span className="font-medium text-zinc-900">
            {PLACEHOLDER_ACTIVE_WORKSPACE}
          </span>
        </p>
        <ToolActivityTable rows={SEED_TOOL_ACTIVITY} />
      </div>
    </AppShell>
  );
}
