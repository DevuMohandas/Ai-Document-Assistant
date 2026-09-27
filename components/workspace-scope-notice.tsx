import Link from "next/link";

type WorkspaceScopeNoticeProps = {
  message: string;
};

export function WorkspaceScopeNotice({ message }: WorkspaceScopeNoticeProps) {
  return (
    <p className="text-sm text-zinc-600">
      {message}{" "}
      <Link href="/workspaces" className="font-medium text-zinc-900 underline">
        Workspaces
      </Link>
    </p>
  );
}
