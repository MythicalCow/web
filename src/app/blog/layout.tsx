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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--body)]">
      <div className="mx-auto max-w-none px-8 pb-32 pt-32 md:px-16 md:pb-36 md:pt-40 lg:pt-64">
        <main>{children}</main>
      </div>
    </div>
  );
}
