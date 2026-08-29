"use client";

import { FormEvent, useState } from "react";
import { submitQuote, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, ShieldCheck, Clock } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inquiryType, setInquiryType] = useState("Bulk Purchase Quote");
  const [formData, setFormData] = useState({ name: "", mobile: "", company: "", message: "" });
  const { showToast } = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitQuote({
        name: formData.name,
        phone: formData.mobile,
        company: formData.company,
        message: formData.message,
        inquiryType,
        source: "contact",
      });
      setSent(true);
      showToast(
        "Inquiry Submitted Successfully!",
        "Our technical sales engineer will reach out with TDS documentation and quote in 1 hour.",
        "success"
      );
    } catch (err) {
      showToast(
        "Could not send inquiry",
        err instanceof ApiError ? err.message : "Please try again in a moment.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <section className="bg-cream pb-12 pt-12 md:pb-16 md:pt-16">
        <div className="mx-auto max-w-3xl space-y-4 px-5 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center rounded-full bg-sage-light px-4 py-1.5 text-xs font-medium text-forest">
            Industrial Sales & Support
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">
            Request Bulk Quotes &amp; Technical Specs
          </h1>
          <p className="text-base leading-relaxed text-text-secondary">
            Need custom chemical synthesis, MSDS documentation, or bulk volume container pricing? Connect with our Gujarat manufacturing unit directly.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-[1.75rem] bg-white p-7 shadow-sm">
              <h3 className="mb-5 border-b border-border-hairline pb-4 text-lg font-semibold text-text-primary">
                Direct Sales Hotline
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-xl bg-sage-light p-2.5 text-forest">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">Email Sales Team</span>
                    <span className="text-sm font-semibold text-text-primary">sales@veejaindyes.com</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-xl bg-sage-light p-2.5 text-forest">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">Phone / WhatsApp</span>
                    <span className="text-sm font-semibold text-text-primary">+91 79 2583 1200</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 rounded-xl bg-sage-light p-2.5 text-forest">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">Factory & Lab</span>
                    <span className="block text-sm font-semibold leading-snug text-text-primary">
                      Plot No. 45, GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad 382445
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-sage-light p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-forest">
                  <Clock className="h-4 w-4" /> Response Guarantee
                </div>
                <p className="mt-1 text-xs text-text-secondary">Quotes and MSDS data sheets dispatched within 1 hour during business hours (Mon-Sat, 9 AM – 7 PM IST).</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-accent/15 bg-white p-6 shadow-sm">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <ShieldCheck className="h-5 w-5 text-accent" /> Quality Tested
              </h4>
              <p className="mt-2 text-sm text-text-secondary">
                Need a 1kg sample batch for lab testing before placing a bulk order? Request sample dispatch through our form.
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-7">
            <form onSubmit={onSubmit} className="rounded-[1.75rem] bg-white p-7 shadow-sm md:p-8">
              <h3 className="mb-6 border-b border-border-hairline pb-4 text-lg font-semibold text-text-primary">
                Send Official Inquiry
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="industrial-label">Inquiry Type</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {["Bulk Purchase Quote", "1kg Sample Request", "Technical Support (TDS)", "Custom Synthesis", "Distributor Partnership"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInquiryType(type)}
                        className={`rounded-full border p-2.5 text-center text-xs font-medium transition ${
                          inquiryType === type
                            ? "border-forest bg-forest text-on-dark"
                            : "border-border-hairline text-text-secondary hover:bg-sage-light"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="industrial-label">Contact Name *</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="industrial-input"
                      placeholder="e.g. Rajesh Kumar"
                      required
                    />
                  </div>
                  <div>
                    <label className="industrial-label">Mobile / WhatsApp *</label>
                    <input
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="industrial-input"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="industrial-label">Company / GSTIN Name</label>
                  <input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="industrial-input"
                    placeholder="e.g. Acme Textile Printers Pvt Ltd"
                  />
                </div>

                <div>
                  <label className="industrial-label">Chemical Specification & Volume Details *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="industrial-input min-h-[110px]"
                    placeholder="Specify compound name, CAS number, purity %, estimated volume, and delivery date..."
                    required
                  />
                </div>

                <button type="submit" disabled={sent || submitting} className="vj-btn vj-btn-primary h-13 w-full gap-2 py-4 text-[15px] disabled:opacity-50">
                  {sent ? (
                    <><CheckCircle2 className="h-5 w-5" /> Inquiry Dispatched</>
                  ) : submitting ? (
                    "Sending…"
                  ) : (
                    <><Send className="h-4 w-4" /> Submit Inquiry <MessageSquare className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
