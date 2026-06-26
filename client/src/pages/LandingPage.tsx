import { useEffect, useState } from "react";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FolderKanban,
  ListTodo,
  Users,
  BarChart3,
  Bell,
  Sparkles,
  Layers,
  Heart,
} from "lucide-react";

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const Navbar: FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-4 left-0 right-0 z-50 mx-auto max-w-7xl px-4 md:px-8`}
    >
      <div
        className={`w-full rounded-full border px-6 py-3 flex items-center justify-between gap-6 transition-all duration-300 ${
          scrolled
            ? "bg-[#081120]/80 backdrop-blur-xl border-blue-500/20 shadow-[0_8px_32px_0_rgba(59,130,246,0.1)]"
            : "bg-[#081120]/40 backdrop-blur-md border-white/5"
        }`}
      >
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-transform duration-300 group-hover:scale-105">
            <span className="text-white font-black text-lg">P</span>
            <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight bg-clip-text">
            ProTrack
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
            Features
          </a>
          <a href="#workflow" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
            Workflow
          </a>
          <a href="#product" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
            Product
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-white rounded-full group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-800"
          >
            <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-[#081120] rounded-full group-hover:bg-opacity-0">
              Get Started
            </span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};

export const LandingPage: FC = () => {
  return (
    <div className="min-h-screen bg-[#081120] text-slate-100 antialiased overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
      {/* Background Decorative Glow Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[50%] left-1/3 w-[550px] h-[550px] bg-blue-800/10 rounded-full blur-[130px] pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Side Info */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Introducing ProTrack v2.0</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
            >
              Manage Projects.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Track Progress.
              </span>
              <br />
              Deliver Faster.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-300 leading-relaxed max-w-lg"
            >
              Powerful project management platform for teams, students, and organizations. Collaborate in real-time and boost productivity.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/register"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/signin"
                className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold transition-all"
              >
                Sign In
              </Link>
            </motion.div>
          </div>

          {/* Right Side Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-[24px] blur-2xl" />
            <div className="relative bg-[#0b1626]/80 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              {/* Fake Window Controls */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-xs text-slate-400 font-mono">protrack-dashboard.app</div>
                <div className="w-8" />
              </div>

              {/* Stats & Progress Bars */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-300">Website Redesign</span>
                    <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">78%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "78%" }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-300">Mobile Application Development</span>
                    <span className="text-xs font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">45%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "45%" }}
                      transition={{ duration: 1.5, delay: 0.7 }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-400">Total Workspace Tasks</div>
                    <div className="text-2xl font-bold text-white mt-1">124</div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-400">Completed Goals</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">87%</div>
                  </div>
                </div>

                {/* Team Activity */}
                <div className="pt-2">
                  <span className="text-xs text-slate-400 block mb-3">Live Team Activity</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 text-xs">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">AS</div>
                      <span className="text-slate-300"><strong className="text-white">Alex S.</strong> completed the main database schemas</span>
                      <span className="ml-auto text-[10px] text-slate-500">2m ago</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 text-xs">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold">ML</div>
                      <span className="text-slate-300"><strong className="text-white">Maria L.</strong> updated 5 tasks in Kanban Board</span>
                      <span className="ml-auto text-[10px] text-slate-500">12m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Features engineered for high-performance teams
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              Streamline work, monitor priorities, and collaborate effortlessly with our design-driven tools.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative bg-[#0b1626]/40 border border-white/5 p-8 rounded-[24px] overflow-hidden hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full group-hover:bg-blue-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Project Management</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Create multiple workspaces, set milestones, and track overall progress dynamically across teams.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative bg-[#0b1626]/40 border border-white/5 p-8 rounded-[24px] overflow-hidden hover:border-indigo-500/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full group-hover:bg-indigo-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                <ListTodo className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Task Tracking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Organize deliverables, customize labels, set due dates, and monitor priorities on intuitive interfaces.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative bg-[#0b1626]/40 border border-white/5 p-8 rounded-[24px] overflow-hidden hover:border-purple-500/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full group-hover:bg-purple-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 border border-purple-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Team Collaboration</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Share notes, add comments, tag colleagues, and coordinate workflows in a cohesive environment.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative bg-[#0b1626]/40 border border-white/5 p-8 rounded-[24px] overflow-hidden hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Kanban Workflow</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Drag-and-drop system to move tasks from To-Do, In Progress to Done with custom columns.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative bg-[#0b1626]/40 border border-white/5 p-8 rounded-[24px] overflow-hidden hover:border-pink-500/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full group-hover:bg-pink-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-6 border border-pink-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Analytics Dashboard</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Visualize velocity charts, track bottlenecks, and export project performance reports instantly.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div
              variants={fadeIn}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative bg-[#0b1626]/40 border border-white/5 p-8 rounded-[24px] overflow-hidden hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full group-hover:bg-cyan-500/10 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Notifications</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive instant alerts, automated deadline warnings, and reminders customized to your workspace.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-32 border-t border-white/5 relative overflow-hidden" style={{background: "linear-gradient(180deg, #081120 0%, #070e1b 50%, #080f1e 100%)"}}>
        {/* Background glows */}
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[80px] pointer-events-none -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Four-Stage Delivery Framework</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
            >
              The lifecycle of{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                delivery
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 text-slate-400 text-lg leading-relaxed"
            >
              Streamline from idea to launch in four simple, highly effective stages.
            </motion.p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Animated connecting line (desktop) */}
            <div className="absolute top-[52px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px hidden lg:block overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-purple-500/30" />
              <motion.div
                initial={{ scaleX: 0, transformOrigin: "left" }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.8, delay: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">

              {/* Step 1 — Create Project */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative flex flex-col"
              >
                {/* Step number badge */}
                <div className="relative flex justify-start mb-6 lg:justify-center">
                  <div className="relative">
                    <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-extrabold text-xl shadow-[0_0_24px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_36px_rgba(59,130,246,0.75)] transition-shadow duration-300 z-10 relative">
                      1
                    </div>
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />
                  </div>
                </div>

                {/* Card */}
                <div className="flex-1 relative bg-gradient-to-br from-[#0d1f3c]/80 to-[#0b1626]/60 border border-white/8 rounded-2xl p-6 backdrop-blur-sm group-hover:border-blue-500/40 group-hover:shadow-[0_8px_40px_rgba(59,130,246,0.12)] transition-all duration-300 overflow-hidden">
                  {/* Corner glow */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/8 rounded-bl-[60px] group-hover:bg-blue-500/15 transition-colors duration-300" />
                  {/* Step label */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    Step 01
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3 group-hover:text-blue-100 transition-colors">Create Project</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Initialize workspaces, define project scopes, set milestones, and invite relevant members.
                  </p>
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/60 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>

              {/* Step 2 — Assign Tasks */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative flex flex-col"
              >
                <div className="relative flex justify-start mb-6 lg:justify-center">
                  <div className="relative">
                    <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-extrabold text-xl shadow-[0_0_24px_rgba(99,102,241,0.5)] group-hover:shadow-[0_0_36px_rgba(99,102,241,0.75)] transition-shadow duration-300 z-10 relative">
                      2
                    </div>
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />
                  </div>
                </div>

                <div className="flex-1 relative bg-gradient-to-br from-[#0e1b3a]/80 to-[#0b1626]/60 border border-white/8 rounded-2xl p-6 backdrop-blur-sm group-hover:border-indigo-500/40 group-hover:shadow-[0_8px_40px_rgba(99,102,241,0.12)] transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/8 rounded-bl-[60px] group-hover:bg-indigo-500/15 transition-colors duration-300" />
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    Step 02
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-100 transition-colors">Assign Tasks</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Break down components, establish priorities, allocate responsibilities, and link dependencies.
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/60 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>

              {/* Step 3 — Track Progress */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative flex flex-col"
              >
                <div className="relative flex justify-start mb-6 lg:justify-center">
                  <div className="relative">
                    <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-extrabold text-xl shadow-[0_0_24px_rgba(168,85,247,0.5)] group-hover:shadow-[0_0_36px_rgba(168,85,247,0.75)] transition-shadow duration-300 z-10 relative">
                      3
                    </div>
                    <div className="absolute inset-0 rounded-full bg-purple-500/20 scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />
                  </div>
                </div>

                <div className="flex-1 relative bg-gradient-to-br from-[#130e2e]/80 to-[#0b1626]/60 border border-white/8 rounded-2xl p-6 backdrop-blur-sm group-hover:border-purple-500/40 group-hover:shadow-[0_8px_40px_rgba(168,85,247,0.12)] transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/8 rounded-bl-[60px] group-hover:bg-purple-500/15 transition-colors duration-300" />
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    Step 03
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3 group-hover:text-purple-100 transition-colors">Track Progress</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Manage work on the live board, review charts, identify and eliminate pipeline blockages quickly.
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/0 via-purple-500/60 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>

              {/* Step 4 — Complete Goals */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.55 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative flex flex-col"
              >
                <div className="relative flex justify-start mb-6 lg:justify-center">
                  <div className="relative">
                    <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-extrabold text-xl shadow-[0_0_24px_rgba(236,72,153,0.5)] group-hover:shadow-[0_0_36px_rgba(236,72,153,0.75)] transition-shadow duration-300 z-10 relative">
                      4
                    </div>
                    <div className="absolute inset-0 rounded-full bg-pink-500/20 scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md" />
                  </div>
                </div>

                <div className="flex-1 relative bg-gradient-to-br from-[#1f0d1a]/80 to-[#0b1626]/60 border border-white/8 rounded-2xl p-6 backdrop-blur-sm group-hover:border-pink-500/40 group-hover:shadow-[0_8px_40px_rgba(236,72,153,0.12)] transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/8 rounded-bl-[60px] group-hover:bg-pink-500/15 transition-colors duration-300" />
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                    Step 04
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3 group-hover:text-pink-100 transition-colors">Complete Goals</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Close milestones, evaluate project velocity reports, export analytics, and start next sprints.
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500/0 via-pink-500/60 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>

            </div>
          </div>

          {/* Bottom CTA strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-20 flex flex-col sm:flex-row items-center justify-center gap-6 text-center"
          >
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Average delivery time reduced by <strong className="text-white">40%</strong></span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Teams report <strong className="text-white">3× faster</strong> onboarding</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span><strong className="text-white">98% satisfaction</strong> across organizations</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Product Showcase */}
      <section id="product" className="py-24 border-t border-white/5 bg-[#081120] relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              A comprehensive dashboard designed for velocity
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              Unlock a unified workspace featuring visual charts, Kanban boards, and smart notifications.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl border border-white/10 bg-[#0b1626]/90 p-4 md:p-6 shadow-2xl backdrop-blur-2xl"
          >
            {/* Mockup Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-400 font-mono w-80 justify-center">
                <span>protrack.app/workspaces/redesign</span>
              </div>
              <div className="w-8" />
            </div>

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar Preview */}
              <div className="lg:col-span-3 space-y-4 border-r border-white/5 pr-6 hidden lg:block">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">PT</div>
                  <div>
                    <h5 className="text-xs font-bold text-white">ProTrack Team</h5>
                    <p className="text-[10px] text-slate-400">Enterprise Workspace</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider mb-2">Projects</div>
                  <div className="flex items-center justify-between text-xs px-2 py-1.5 text-blue-400 bg-blue-500/5 rounded font-medium border border-blue-500/10">
                    <span>Website Redesign</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <div className="flex items-center justify-between text-xs px-2 py-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                    <span>Mobile Application</span>
                  </div>
                  <div className="flex items-center justify-between text-xs px-2 py-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                    <span>API Integrations</span>
                  </div>
                </div>
              </div>

              {/* Board and Main Section */}
              <div className="lg:col-span-9 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">Website Redesign</h4>
                    <p className="text-xs text-slate-400">Sprint planning, tasks, and team milestones</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-900 border border-white/5 px-2.5 py-1 rounded text-slate-400">Filter: All</span>
                    <span className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 cursor-pointer">New Task</span>
                  </div>
                </div>

                {/* Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Column 1 */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-slate-300">To Do</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">3</span>
                    </div>
                    <div className="bg-[#0b1626] p-3 rounded-lg border border-white/5 space-y-2 hover:border-white/10 transition-all cursor-pointer">
                      <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/20">Design</span>
                      <p className="text-xs text-slate-200 font-semibold">Develop main application layouts</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[9px] text-slate-500">June 25</span>
                        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white">JD</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-slate-300">In Progress</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">1</span>
                    </div>
                    <div className="bg-[#0b1626] p-3 rounded-lg border border-blue-500/20 space-y-2 shadow-lg shadow-blue-500/5 cursor-pointer">
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20">Development</span>
                      <p className="text-xs text-slate-200 font-semibold">Integrate OAuth 2.0 Auth providers</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[9px] text-slate-400">June 22</span>
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] text-white font-bold">AS</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold text-slate-300">Done</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">4</span>
                    </div>
                    <div className="bg-[#0b1626] p-3 rounded-lg border border-white/5 opacity-65 space-y-2 cursor-pointer">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">DevOps</span>
                      <p className="text-xs text-slate-200 font-semibold line-through">Configure Vercel CD Pipelines</p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[9px] text-slate-500">June 18</span>
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[8px] text-white">ML</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/30 border border-white/10 p-8 md:p-14 text-center space-y-8 backdrop-blur-3xl shadow-3xl"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-blue-600/5 blur-3xl pointer-events-none" />

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Ready to streamline your workflow?
            </h2>
            <p className="text-slate-300 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Join thousands of teams, organizations, and individuals. Build projects, manage timelines, and achieve success with ProTrack today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started
              </Link>
              <Link
                to="/signin"
                className="px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold transition-all"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#060c16]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">
                P
              </div>
              <span className="text-white font-bold text-lg">ProTrack</span>
            </Link>
            <div className="flex gap-8 text-sm text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
              <a href="#product" className="hover:text-white transition-colors">Product</a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              Built with <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> for teams, students, and organizations.
            </span>
            <Link to="/register" className="text-xs text-slate-400 hover:text-white transition-colors font-medium">
              Get Started →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;