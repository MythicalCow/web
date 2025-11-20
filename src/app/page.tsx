"use client";
import React from "react";
import AsciiFluid from "@/components/AsciiFluid";

const experiences = [
  {
    role: "Incoming Software Engineer",
    company: "Anduril",
    date: "August 2026",
    incoming: true,
  },
  {
    role: "Inference Engineer",
    company: "Deepgrove",
    yc: "S25",
    date: "September 2025 – Present",
  },
  {
    role: "Software Engineer Intern",
    company: "Guardian RF",
    yc: "S24",
    date: "December 2024 – Present",
  },
  {
    role: "Software Engineer Intern",
    company: "CACI International Inc",
    date: "May 2025 – July 2025",
  },
  {
    role: "Software Engineer Intern",
    company: "Khoj AI",
    yc: "S23",
    date: "May 2024 – August 2024",
  },
];

export default function Home() {
  return (
    <main className="bg-white min-h-screen">
      <div id="home" className="max-w-4xl mx-auto px-6 py-40">
        <div className="mb-12 -mt-20">
          <AsciiFluid />
        </div>
        <h1 className="text-3xl font-medium text-[#282828] mb-4">
          Raghav Tirumale
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-12">
          Building high-performance AI infrastructure and systems software at early-stage startups, optimizing kernels across GPUs and other specialized hardware to push the boundaries of what&apos;s possible.
        </p>

        <div className="space-y-0">
          {experiences.map((exp, index) => (
            <div
              key={index}
              className="py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className={`text-base ${exp.incoming ? "text-gray-500" : "text-[#282828]"}`}>
                    {exp.role}
                  </div>
                  <div className="text-base text-gray-500 mt-0.5">
                    {exp.company}
                    {exp.yc && (
                      <span className="ml-1 italic">(YC {exp.yc})</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                  {exp.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
