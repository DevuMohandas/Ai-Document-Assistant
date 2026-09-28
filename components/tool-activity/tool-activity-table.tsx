import type { ToolActivityRow, ToolCallStatus } from "@/lib/types/tool-activity";

function statusStyles(status: ToolCallStatus): string {
  switch (status) {
    case "Success":
      return "bg-emerald-50 text-emerald-800";
    case "Failed":
      return "bg-red-50 text-red-800";
    case "Pending":
      return "bg-amber-50 text-amber-800";
  }
}

type ToolActivityTableProps = {
  rows: ToolActivityRow[];
};

export function ToolActivityTable({ rows }: ToolActivityTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-100 bg-zinc-50 text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Tool name</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Date / time</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                No tool activity yet for this workspace.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-50 last:border-0">
                <td className="px-4 py-3 font-mono text-zinc-900">
                  {row.toolName}
                </td>
                <td className="px-4 py-3 text-zinc-700">{row.description}</td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                  {row.occurredAt}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles(row.status)}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
