type PlaceholderPanelProps = {
  heading: string;
  children: React.ReactNode;
};

export function PlaceholderPanel({ heading, children }: PlaceholderPanelProps) {
  return (
    <section
      className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 shadow-sm"
    >
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        {heading}
      </h2>
      <div className="mt-4 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  );
}
