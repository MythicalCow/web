import type { Metadata } from "next";
import { InkShell } from "@/components/InkPage";

export const metadata: Metadata = {
  title: "Writing",
  description: "Notes on GPU kernels, processor design, and making machine intelligence run fast.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <InkShell>
      <main className="px-6 py-12 md:px-14 md:py-16">{children}</main>
    </InkShell>
  );
}
