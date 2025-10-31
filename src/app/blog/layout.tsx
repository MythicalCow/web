import type { Metadata } from "next";
import Navigation from "@/components/Navigation";

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
    <div className="min-h-screen bg-white text-[#282828]">
      <Navigation />
      <div className="max-w-4xl mx-auto px-6 py-32">
        <header className="mb-12">
          <h1 className="text-2xl font-medium text-left text-[#282828]">Posts</h1>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
