"use client";

import EducationGrid from "@/components/education/EducationGrid";

export default function EducationPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Education</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-secondary sm:text-base">
          Watch dyeing and printing videos .
        </p>
      </div>
      <EducationGrid />
    </div>
  );
}
