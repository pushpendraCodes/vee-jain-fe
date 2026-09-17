import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { ShieldCheck, Award, ArrowRight, FlaskConical, Truck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-bg pb-14 pt-12 md:pb-20 md:pt-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-xs font-medium text-ink">
              <Award className="h-4 w-4" /> Manufacturing excellence in precision dyes
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl md:text-6xl">
              Precision Chemistry.<br />Reliable Color.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
              {BRAND} is a leading Indian chemical manufacturer specializing in reactive dyes, screen
              printing inks, industrial solvents, and specialized textile auxiliaries.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/shop" className="vj-btn vj-btn-primary h-12 px-7 text-[15px]">
                Explore Catalog <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="vj-btn vj-btn-ghost h-12 px-7 text-[15px]">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Quality Assurance",
                desc: "Every batch is reviewed for color consistency and process reliability before dispatch.",
              },
              {
                icon: FlaskConical,
                title: "R&D Synthesis Lab",
                desc: "Our Vatva industrial lab develops custom dye formulations tailored to substrate requirements.",
              },
              {
                icon: Truck,
                title: "Pan-India Logistics",
                desc: "Hazardous and non-hazardous packaging ranging from sample pails to bulk drums.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl bg-surface p-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
                  <card.icon className="h-5 w-5 text-ink" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{card.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-2">
            <div className="relative min-h-[280px] bg-forest p-8 text-on-dark lg:p-12">
              <div className="pointer-events-none absolute inset-0 opacity-10 sci-grid" />
              <div className="relative flex h-full flex-col justify-end">
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-sage-light">Company Focus</span>
                <h2 className="font-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                  Science, Precision &amp; Industrial Reliability
                </h2>
              </div>
            </div>
            <div className="bg-surface p-8 lg:p-12">
              <p className="text-base leading-relaxed text-text-secondary">
                We combine laboratory discipline with industrial supply reliability — helping buyers
                source high-purity reactive dyes and chemicals with clear technical guidance.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Precision color performance",
                  "High-purity product focus",
                  "Technical application support",
                  "Reliable industrial supply",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium text-text-primary">
                    <span className="h-2 w-2 rounded-full bg-brand" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
