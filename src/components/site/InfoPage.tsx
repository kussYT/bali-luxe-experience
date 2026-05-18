type InfoPageProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

export function InfoPage({ eyebrow, title, children }: InfoPageProps) {
  return (
    <section className="px-6 md:px-14 py-24 max-w-3xl">
      <p className="text-eyebrow text-muted-foreground">{eyebrow}</p>
      <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">{title}</h1>
      <div className="mt-10 space-y-5 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
