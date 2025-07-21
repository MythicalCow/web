import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "My personal blog with thoughts on technology and development",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-left">Posts</h1>
        </header>
        <main className="max-w-4xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
