import React from "react";

// HeroHeader component: a premium looking hero section with gradient background,
// glassmorphism overlay, animated text, and a call‑to‑action button.
// Uses Tailwind CSS classes (already configured in the project) and a
// subtle background animation via CSS keyframes.

const HeroHeader: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-center text-white shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      {/* Background animation */}
      <div className="absolute inset-0 -z-10 animate-pulse opacity-30 bg-white" />

      <h1 className="mb-4 text-4xl font-extrabold tracking-tight drop-shadow-lg md:text-5xl">
        Analytics Dashboard
      </h1>
      <p className="mb-6 max-w-2xl mx-auto text-lg text-purple-100 drop-shadow md:text-xl">
        Get real‑time insights into your project's performance, tasks, and team activity.
      </p>
      <a
        href="/projects"
        className="inline-block rounded-full bg-white/10 px-6 py-3 text-base font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
      >
        View Projects
      </a>
    </section>
  );
};

export default HeroHeader;
