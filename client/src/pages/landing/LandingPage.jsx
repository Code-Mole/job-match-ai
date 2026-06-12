import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Upload,
  Zap,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  Star,
  ChevronDown,
  Briefcase,
  Globe,
  Shield,
  BarChart3,
  BookOpen,
  Users,
  Sparkles,
  Target,
  Award,
  Clock,
} from "lucide-react";
import ThemeToggle from "../../components/ui/ThemeToggle";

/* ─── tiny hook: returns true once element enters viewport ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── animated counter ─── */
function Counter({ end, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── floating job card (hero decoration) ─── */
function FloatingCard({ title, company, score, color, style }) {
  const colors = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
  };
  return (
    <div
      className="absolute bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-white/10 w-56 select-none"
      style={style}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-xl ${colors[color]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
        >
          {company[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {company}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Match score
        </span>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          {score}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colors[color]} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/* ─── main component ─── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [heroRef, heroVisible] = useInView(0.1);
  const [howRef, howVisible] = useInView(0.1);
  const [featRef, featVisible] = useInView(0.1);
  const [statsRef, statsVisible] = useInView(0.2);
  const [sectorsRef, sectVisible] = useInView(0.1);
  const [testimonRef, testVisible] = useInView(0.1);
  const [ctaRef, ctaVisible] = useInView(0.2);

  /* parallax on hero blobs */
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const b1 = document.getElementById("blob1");
      const b2 = document.getElementById("blob2");
      if (b1) b1.style.transform = `translateY(${y * 0.12}px)`;
      if (b2) b2.style.transform = `translateY(${-y * 0.08}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const steps = [
    {
      icon: Upload,
      title: "Upload your CV",
      desc: "Drop your PDF, DOCX, or text CV. Our AI reads it in seconds and extracts every skill.",
      color: "blue",
    },
    {
      icon: Zap,
      title: "AI analyses your profile",
      desc: "TF-IDF matching and cosine similarity score every job against your exact skill set.",
      color: "amber",
    },
    {
      icon: Target,
      title: "Get ranked matches",
      desc: "See a ranked list with transparent scores, matched skills, and what you are missing.",
      color: "emerald",
    },
    {
      icon: BookOpen,
      title: "Close the skill gaps",
      desc: "A personalised learning path with free and paid courses for every missing skill.",
      color: "purple",
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "AI job matching",
      desc: "Semantic NLP matching finds jobs that fit your skills — not just keyword hits.",
      color: "blue",
    },
    {
      icon: BarChart3,
      title: "Transparent scores",
      desc: "Every match shows a breakdown: skill fit, experience, growth trend, and culture.",
      color: "emerald",
    },
    {
      icon: TrendingUp,
      title: "Skill gap analysis",
      desc: "See exactly which skills separate you from any role you are interested in.",
      color: "amber",
    },
    {
      icon: BookOpen,
      title: "Learning paths",
      desc: "Prioritised course recommendations — free resources first — for every gap.",
      color: "purple",
    },
    {
      icon: MessageSquare,
      title: "AI career assistant",
      desc: "Chat with Claude about salaries, career paths, and your next move.",
      color: "pink",
    },
    {
      icon: Globe,
      title: "All sectors covered",
      desc: "Tech, healthcare, finance, legal, trades, education — real jobs from every industry.",
      color: "teal",
    },
  ];

  const sectors = [
    "Technology",
    "Healthcare",
    "Finance",
    "Legal",
    "Education",
    "Marketing",
    "Engineering",
    "Hospitality",
    "Logistics",
    "Design",
    "Sales",
    "HR",
    "Creative",
    "Data Science",
    "Operations",
  ];

  const testimonials = [
    {
      name: "Amara Osei",
      role: "Software Engineer",
      avatar: "AO",
      color: "blue",
      text: "I uploaded my CV and within 30 seconds had a ranked list of jobs with exact skill breakdowns. I could see precisely why each role was a good fit — no guessing.",
      stars: 5,
    },
    {
      name: "Kezia Mwangi",
      role: "Marketing Manager",
      avatar: "KM",
      color: "purple",
      text: "The skill gap feature changed how I approach job hunting. Instead of wondering why I get rejected, I now know exactly what to learn next and have a clear plan.",
      stars: 5,
    },
    {
      name: "David Asante",
      role: "Data Analyst",
      avatar: "DA",
      color: "emerald",
      text: "The AI assistant gave me career advice that was actually tailored to my background. It knew my skills and gave concrete suggestions rather than generic tips.",
      stars: 5,
    },
  ];

  const colorMap = {
    blue: {
      light: "bg-blue-50 dark:bg-blue-900/20",
      icon: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
      avatar:
        "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    },
    emerald: {
      light: "bg-emerald-50 dark:bg-emerald-900/20",
      icon: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
      avatar:
        "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    },
    amber: {
      light: "bg-amber-50 dark:bg-amber-900/20",
      icon: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
      avatar:
        "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    },
    purple: {
      light: "bg-purple-50 dark:bg-purple-900/20",
      icon: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/40",
      avatar:
        "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
    },
    pink: {
      light: "bg-pink-50 dark:bg-pink-900/20",
      icon: "text-pink-600 dark:text-pink-400",
      iconBg: "bg-pink-100 dark:bg-pink-900/40",
      avatar:
        "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
    },
    teal: {
      light: "bg-teal-50 dark:bg-teal-900/20",
      icon: "text-teal-600 dark:text-teal-400",
      iconBg: "bg-teal-100 dark:bg-teal-900/40",
      avatar:
        "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300",
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden font-sans">
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-white text-sm">
                J
              </span>
            </div>
            <span className="font-display font-bold text-lg text-slate-900 dark:text-slate-50">
              JobMatch AI
            </span>
          </div>

          {/* Nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            {["How it works", "Features", "Sectors", "Testimonials"].map(
              (link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  {link}
                </a>
              ),
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 active:scale-95"
            >
              Get started free
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center pt-16 overflow-hidden"
        id="hero"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />

        {/* Blobs */}
        <div
          id="blob1"
          className="absolute top-20 left-0 w-[600px] h-[600px] bg-blue-200/40 dark:bg-blue-800/15 rounded-full blur-3xl pointer-events-none will-change-transform"
          style={{ transform: "translateX(-30%)" }}
        />
        <div
          id="blob2"
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-800/15 rounded-full blur-3xl pointer-events-none will-change-transform"
          style={{ transform: "translateX(20%)" }}
        />

        {/* Grid dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div
            className="transition-all duration-700"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "none" : "translateY(40px)",
            }}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={12} />
              AI-powered job matching for every sector
            </div>

            <h1 className="font-display font-bold text-5xl sm:text-6xl text-slate-900 dark:text-slate-50 leading-[1.08] mb-6">
              Find jobs that{" "}
              <span className="relative">
                <span className="text-blue-600 dark:text-blue-400">
                  actually
                </span>
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  height="6"
                >
                  <path
                    d="M0 6 Q25 2 50 5 Q75 8 100 4"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              match your skills
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-lg">
              Upload your CV and get AI-powered job matches, a transparent score
              breakdown, skill gap analysis, and a personalised learning path —
              in under 30 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <button
                onClick={() => navigate("/signup")}
                className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-150 active:scale-95 shadow-lg shadow-blue-500/25 text-base"
              >
                Get started free
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-semibold px-7 py-3.5 rounded-xl transition-all duration-150 text-base"
              >
                Sign in
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-5">
              {[
                { icon: Shield, text: "No card required" },
                { icon: Clock, text: "Results in 30 seconds" },
                { icon: Award, text: "All sectors covered" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"
                >
                  <Icon
                    size={14}
                    className="text-blue-500 dark:text-blue-400"
                  />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating cards */}
          <div
            className="relative h-[420px] hidden lg:block"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "none" : "translateY(40px)",
              transition: "all 0.7s 0.2s",
            }}
          >
            {/* Central phone-like frame */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-72 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
              {/* Mini dashboard */}
              <div className="bg-blue-600 px-4 py-3">
                <p className="text-white/80 text-xs mb-1">Your top match</p>
                <p className="text-white font-bold text-sm">
                  Senior Frontend Dev
                </p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: "Skill match", pct: 92, color: "bg-blue-500" },
                  { label: "Experience fit", pct: 88, color: "bg-purple-500" },
                  { label: "Growth trend", pct: 95, color: "bg-emerald-500" },
                  { label: "Cultural fit", pct: 80, color: "bg-amber-500" },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">
                        {label}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3">
                <div className="bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg text-center">
                  View all 24 matches →
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <FloatingCard
              title="Full Stack Engineer"
              company="Vercel"
              score={85}
              color="blue"
              style={{
                top: "5%",
                left: "-5%",
                animation: "float 4s ease-in-out infinite",
              }}
            />
            <FloatingCard
              title="Data Scientist"
              company="Hugging Face"
              score={78}
              color="emerald"
              style={{
                bottom: "8%",
                right: "-5%",
                animation: "float 4s ease-in-out 1s infinite",
              }}
            />

            {/* Skill tag badge */}
            <div
              className="absolute top-[10%] right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5"
              style={{ animation: "float 5s ease-in-out 0.5s infinite" }}
            >
              <CheckCircle2 size={12} className="text-emerald-500" />7 skills
              extracted
            </div>

            {/* Match count badge */}
            <div
              className="absolute bottom-[15%] left-0 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50 rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300"
              style={{ animation: "float 4.5s ease-in-out 1.5s infinite" }}
            >
              ✓ 24 matches found
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 dark:text-slate-600 animate-bounce">
          <ChevronDown size={20} />
        </div>

        {/* Float animation */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-10px); }
          }
        `}</style>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      <section
        ref={statsRef}
        className="border-y border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-slate-900/50"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                value: 50000,
                suffix: "+",
                label: "Live job listings",
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                value: 83,
                suffix: "",
                label: "Canonical skills tracked",
                color: "text-purple-600 dark:text-purple-400",
              },
              {
                value: 27,
                suffix: "",
                label: "Job sectors covered",
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                value: 347,
                suffix: "+",
                label: "Skill alias mappings",
                color: "text-amber-600 dark:text-amber-400",
              },
            ].map(({ value, suffix, label, color }) => (
              <div
                key={label}
                className="text-center"
                style={{
                  opacity: statsVisible ? 1 : 0,
                  transform: statsVisible ? "none" : "translateY(20px)",
                  transition: "all 0.5s",
                }}
              >
                <p className={`font-display font-bold text-4xl mb-1 ${color}`}>
                  <Counter end={value} suffix={suffix} />
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              How it works
            </p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 dark:text-slate-50 mb-4">
              From CV to matches in four steps
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              The entire pipeline runs automatically. You upload once — the AI
              handles the rest.
            </p>
          </div>

          {/* Steps */}
          <div
            ref={howRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {steps.map((step, i) => {
              const c = colorMap[step.color];
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={`relative rounded-2xl p-6 border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 transition-all duration-500`}
                  style={{
                    opacity: howVisible ? 1 : 0,
                    transform: howVisible ? "none" : "translateY(30px)",
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-xs font-bold text-slate-300 dark:text-slate-700 font-display">
                    0{i + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center mb-4`}
                  >
                    <Icon size={20} className={c.icon} />
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>

                  {/* Connector arrow (not on last) */}
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <ArrowRight
                        size={14}
                        className="text-slate-300 dark:text-slate-600"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Features
            </p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 dark:text-slate-50 mb-4">
              Everything you need to land the right role
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Six tools built into one platform. No subscriptions, no limits, no
              hidden paywalls.
            </p>
          </div>

          <div
            ref={featRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feat, i) => {
              const c = colorMap[feat.color];
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group rounded-2xl p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/8 hover:border-blue-200 dark:hover:border-blue-700/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 cursor-default"
                  style={{
                    opacity: featVisible ? 1 : 0,
                    transform: featVisible ? "none" : "translateY(30px)",
                    transitionDelay: `${i * 80}ms`,
                    transition: `opacity 0.5s ${i * 80}ms, transform 0.5s ${i * 80}ms, border-color 0.2s, box-shadow 0.2s`,
                  }}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon size={20} className={c.icon} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Sectors ─────────────────────────────────────────────────── */}
      <section
        id="sectors"
        className="py-24 bg-white dark:bg-slate-950 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Sectors
            </p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 dark:text-slate-50 mb-4">
              Not just tech. Every industry.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Jobs aggregated from Adzuna and Remotive across every professional
              sector — over 27 categories.
            </p>
          </div>

          {/* Scrolling ticker */}
          <div
            ref={sectorsRef}
            className="relative"
            style={{
              opacity: sectVisible ? 1 : 0,
              transition: "opacity 0.8s",
            }}
          >
            {/* First row — left scroll */}
            <div className="flex gap-3 mb-3 overflow-hidden">
              <div
                className="flex gap-3 flex-shrink-0"
                style={{ animation: "ticker-left 25s linear infinite" }}
              >
                {[...sectors, ...sectors].map((s, i) => (
                  <span
                    key={i}
                    className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/8 text-slate-700 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Second row — right scroll */}
            <div className="flex gap-3 overflow-hidden">
              <div
                className="flex gap-3 flex-shrink-0"
                style={{ animation: "ticker-right 30s linear infinite" }}
              >
                {[...sectors.slice(5), ...sectors, ...sectors.slice(0, 5)].map(
                  (s, i) => (
                    <span
                      key={i}
                      className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-sm font-medium px-4 py-2 rounded-full"
                    >
                      {s}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white dark:from-slate-950 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none" />
          </div>
        </div>

        <style>{`
          @keyframes ticker-left  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes ticker-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        `}</style>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────── */}
      <section
        id="testimonials"
        className="py-24 bg-slate-50 dark:bg-slate-900/50"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Testimonials
            </p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-slate-900 dark:text-slate-50 mb-4">
              What job seekers are saying
            </h2>
          </div>

          <div
            ref={testimonRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => {
              const c = colorMap[t.color];
              return (
                <div
                  key={t.name}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-white/8 flex flex-col"
                  style={{
                    opacity: testVisible ? 1 : 0,
                    transform: testVisible ? "none" : "translateY(30px)",
                    transitionDelay: `${i * 120}ms`,
                    transition: `all 0.5s ${i * 120}ms`,
                  }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star
                        key={j}
                        size={14}
                        className="text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1 mb-5">
                    "{t.text}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full ${c.avatar} flex items-center justify-center text-xs font-bold flex-shrink-0`}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div
            ref={ctaRef}
            className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-10 sm:p-14 text-center overflow-hidden"
            style={{
              opacity: ctaVisible ? 1 : 0,
              transform: ctaVisible ? "none" : "scale(0.96)",
              transition: "all 0.6s",
            }}
          >
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Blobs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Sparkles size={12} />
                Free forever — no credit card needed
              </div>

              <h2 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 leading-tight">
                Ready to find your next role?
              </h2>
              <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
                Upload your CV today and see exactly how you match against
                thousands of real job listings — in every sector, across the
                world.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/signup")}
                  className="group flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all duration-150 active:scale-95 shadow-xl text-base"
                >
                  Create free account
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-150 text-base"
                >
                  Sign in to your account
                </button>
              </div>

              {/* Mini trust signals */}
              <div className="flex flex-wrap justify-center gap-6 mt-10">
                {[
                  { icon: Users, text: "Join thousands of job seekers" },
                  { icon: Shield, text: "Your data is never sold" },
                  { icon: Zap, text: "Results in under 30 seconds" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-blue-100 text-sm"
                  >
                    <Icon size={14} />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-white/8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="font-display font-bold text-white text-xs">
                  J
                </span>
              </div>
              <span className="font-display font-bold text-slate-900 dark:text-slate-50">
                JobMatch AI
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              {[
                { label: "Sign in", action: () => navigate("/login") },
                { label: "Sign up", action: () => navigate("/signup") },
                { label: "Dashboard", action: () => navigate("/") },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Credit */}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Built with React · Flask · Claude API
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 text-center text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} JobMatch AI — Final Year Project
          </div>
        </div>
      </footer>
    </div>
  );
}
