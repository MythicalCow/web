import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Notes on GPU kernels, processor design, and making machine intelligence run fast.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#c8c8c8]">
      <div className="max-w-2xl mx-auto px-8 md:px-16 py-32">
        <main>{children}</main>
      </div>
    </div>
  );
}
