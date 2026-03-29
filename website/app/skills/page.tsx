import { Suspense } from "react";
import { SkillsPage } from "@/components/client/skills-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-shell px-4 py-12 text-sm text-slate-500 sm:px-6 lg:px-8">Loading skills…</div>}>
      <SkillsPage />
    </Suspense>
  );
}
