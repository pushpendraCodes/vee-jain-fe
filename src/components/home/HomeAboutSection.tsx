import Link from "next/link";
import { BRAND } from "@/lib/constants";
import Reveal from "@/components/visual/Reveal";
import { ArrowRight, Beaker, Factory, FlaskConical, MapPin } from "lucide-react";

const FOCUS = [
  {
    icon: FlaskConical,
    title: "Reactive dyes",
    desc: "High-purity colourants for consistent textile performance.",
  },
  {
    icon: Beaker,
    title: "Specialty chemicals",
    desc: "Solvents, auxiliaries, and process chemistry for industry.",
  },
  {
    icon: Factory,
    title: "Print solutions",
    desc: "Inks, frames, and tools for reliable screen printing.",
  },
];

export default function HomeAboutSection() {
  return (
    <section className="relative overflow-hidden border-b border-forest/5 py-14 md:py-20">
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-sage/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <Reveal>
            <div>
              <p className="tech-label mb-3 inline-flex items-center gap-2 rounded-full bg-sage-light px-3.5 py-1.5 text-forest">
                <MapPin className="h-3.5 w-3.5" />
                Ludhiyana Punjab · Established manufacturer
              </p>

              <h2 className="font-display max-w-xl text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl sm:leading-[1.12]">
                About {BRAND}
              </h2>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg md:leading-relaxed">
                We manufacture and supply precision reactive dyes, specialty chemicals, and print-ready
                solutions for textile and industrial buyers who need batch-level consistency — not guesswork.
              </p>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-[15px]">
                From lab formulation in Vatva to pan-India dispatch, our focus is clear technical guidance,
                verified purity, and reliable supply for modern manufacturing.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/about" className="vj-btn vj-btn-primary h-11 px-6 text-sm">
                  Our story <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/shop" className="vj-btn vj-btn-ghost h-11 px-6 text-sm">
                  Browse catalog
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={80}>
            <div className="relative overflow-hidden rounded-[1.75rem] bg-forest p-7 text-on-dark sm:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-[0.07] sci-grid" />
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/25 blur-2xl" />

              <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                What we do
              </p>
              <p className="relative mt-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Chemistry built for colour, process, and production.
              </p>

              <ul className="relative mt-7 space-y-5">
                {FOCUS.map((item) => (
                  <li key={item.title} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                      <item.icon className="h-4 w-4 text-sage-light" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-white/65">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
