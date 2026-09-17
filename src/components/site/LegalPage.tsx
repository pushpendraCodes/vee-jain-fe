"use client";

import Link from "next/link";
import { useSite } from "@/components/site/SiteProvider";
import { isEmptyHtml, looksLikeHtml, sanitizeHtml } from "@/lib/sanitizeHtml";

export default function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const { site } = useSite();
  const title = kind === "privacy" ? "Privacy policy" : "Terms & conditions";
  const body = kind === "privacy" ? site.privacyPolicy : site.termsConditions;
  const empty = !body.trim() || isEmptyHtml(body);
  const html = looksLikeHtml(body) ? sanitizeHtml(body) : "";

  return (
    <div className="bg-bg">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">{site.siteName}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-5xl">{title}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
        {empty ? (
          <p className="rounded-2xl bg-surface p-8 text-sm text-text-secondary">
            This page will be published from the admin settings shortly.
          </p>
        ) : html ? (
          <div className="legal-prose rounded-2xl bg-surface p-6 sm:p-10" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="whitespace-pre-wrap rounded-2xl bg-surface p-6 text-sm leading-relaxed text-text-secondary sm:p-10">
            {body}
          </div>
        )}
        <Link href="/" className="mt-8 inline-flex text-sm font-medium text-ink-mute hover:text-ink">
          Back to home
        </Link>
      </div>
    </div>
  );
}
