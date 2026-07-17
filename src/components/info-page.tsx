import Link from "next/link";
import { Container } from "@/components/ui/container";

export type InfoSection = { title: string; body: string };

/** Zajednički layout za statične informativne stranice (cjenik, savjeti, privatnost…). */
export function InfoPage({
  title,
  intro,
  sections,
  backHref = "/",
  backLabel = "Početna",
}: {
  title: string;
  intro?: string;
  sections: InfoSection[];
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <>
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-line)]">
        <Container className="py-10 md:py-14">
          <nav className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-2">
            <Link href={backHref} className="hover:text-[var(--color-ink)]">{backLabel}</Link>
            <span>›</span>
            <span className="text-[var(--color-ink-soft)]">{title}</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">{title}</h1>
          {intro && (
            <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)] leading-relaxed">{intro}</p>
          )}
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        <div className="max-w-2xl space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-xl tracking-tight text-[var(--color-ink)] mb-2">
                {s.title}
              </h2>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-line">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
