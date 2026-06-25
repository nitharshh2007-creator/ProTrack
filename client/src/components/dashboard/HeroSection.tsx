import React from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useAuth } from "@/store/auth.store";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  totalProjects: number;
  totalTasks: number;
  completionPct: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ totalProjects, totalTasks, completionPct }) => {
  const { user } = useAuth();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <GlassCard className="rounded-2xl p-8 md:p-10 overflow-hidden relative hero-card">
        {/* Floating glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-violet-600/8 blur-2xl" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{greeting}, {user?.name?.split(" ")[0]} 👋</p>
            <h1 className="text-3xl font-extrabold text-[#F8FAFC]">Your workspace at a glance</h1>
            <p className="mt-2 text-sm text-slate-400">
              Keep track of projects and tasks. Stay productive.
            </p>
          </div>
          {/* Avatar */}
          {(user as any)?.avatarUrl && (
            <img
              src={(user as any).avatarUrl}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover border border-white/20 shadow-lg"
            />
          )}
        </div>
        <div className="flex items-center gap-8 mt-6">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-[#F8FAFC]">
              <AnimatedCounter to={completionPct} />%
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Completion</p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-[#F8FAFC]">
              <AnimatedCounter to={totalProjects} />
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Projects</p>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-[#F8FAFC]">
              <AnimatedCounter to={totalTasks} />
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Tasks</p>
          </div>
        </div>
        {/* CTA Buttons */}
        <div className="flex gap-4 mt-6">
          <button className="btn-primary gradient-primary text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition">
            View Analytics
            <ArrowRight className="inline-block ml-1 h-4 w-4" />
          </button>
          <button className="bg-white/10 text-white px-5 py-2 rounded-full border border-white/20 hover:bg-white/20 transition">
            Create Project
            <ArrowRight className="inline-block ml-1 h-4 w-4" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
};
