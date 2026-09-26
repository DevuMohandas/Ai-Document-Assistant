"use client";

type WorkspaceSwitcherProps = {
  className?: string;
  id?: string;
};

export function WorkspaceSwitcher({ className, id }: WorkspaceSwitcherProps) {
  return (
    <select
      id={id}
      className={className}
      defaultValue="acme"
      aria-label="Active workspace"
      onChange={() => {
        // TODO: persist selection and reload workspace-scoped data
      }}
    >
      <option value="acme">Acme Corp</option>
      <option value="personal">Personal</option>
      <option value="demo">Demo workspace</option>
    </select>
  );
}
