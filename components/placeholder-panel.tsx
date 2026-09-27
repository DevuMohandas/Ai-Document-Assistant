type PlaceholderPanelProps = {
  heading: string;
  children: React.ReactNode;
  className?: string;
};

export function PlaceholderPanel({
  heading,
  children,
  className,
}: PlaceholderPanelProps) {
  return (
    <section
      className={`rounded-xl border border-dashed border-zinc-300 bg-white p-6 shadow-sm ${className ?? ""}`}
    >
      <h2 className="shrink-0 text-sm font-medium uppercase tracking-wide text-zinc-500">
        {heading}
      </h2>
      <div className="mt-4 min-h-0 flex-1 text-sm leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}
