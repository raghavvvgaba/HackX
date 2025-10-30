import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShieldAlt,
  FaCloudUploadAlt,
  FaShareAlt,
  FaUserMd,
  FaLock,
  FaRocket,
  FaHeart,
  FaHistory,
} from "react-icons/fa";
import { MdOutlineHealthAndSafety } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/authContext";

// ------------------------------ DATA MODELS ------------------------------
// Features based on actual implemented functionality
const features = [
  {
    id: "profiles",
    icon: <FaUserMd className="text-3xl md:text-4xl text-accent" />,
    title: "Comprehensive Health Profiles",
    blurb: "Complete health information management for patients and doctors.",
    points: [
      "Basic info, medical history & lifestyle data",
      "Emergency contacts & accessibility needs",
      "Blood group, allergies & current medications",
    ],
    accent: "from-accent/20 via-accent/10 to-transparent",
  },
  {
    id: "sharing",
    icon: <FaShareAlt className="text-3xl md:text-4xl text-accent" />,
    title: "Secure Doctor Sharing",
    blurb: "Share your complete health profile with doctors using unique Doctor IDs.",
    points: [
      "Simple DR-XXXX-1234 ID system",
      "Instant access for authorized doctors",
      "Revoke access anytime",
    ],
    accent: "from-primary/25 via-primary/10 to-transparent",
  },
  {
    id: "records",
    icon: <FaHistory className="text-3xl md:text-4xl text-accent" />,
    title: "Medical Records Management",
    blurb: "Doctors can add & manage comprehensive medical records for their patients.",
    points: [
      "Diagnosis, symptoms & prescribed medications",
      "Test recommendations & follow-up notes",
      "Secure access with audit trails",
    ],
    accent: "from-accent/30 via-accent/10 to-transparent",
  },
  {
    id: "ai",
    icon: <FaRocket className="text-3xl md:text-4xl text-accent" />,
    title: "AI Health Assistant",
    blurb: "Get instant answers to health questions and general medical guidance.",
    points: [
      "24/7 health information support",
      "General wellness advice",
      "Medical term explanations",
    ],
    accent: "from-primary/30 via-primary/10 to-transparent",
  },
];

const journeySteps = [
  {
    icon: <FaRocket className="text-accent" />,
    title: "Create Account",
    text: "Sign up as a patient or doctor and get started immediately.",
  },
  {
    icon: <FaUserMd className="text-accent" />,
    title: "Complete Profile",
    text: "Fill in your health information, medical history & emergency contacts.",
  },
  {
    icon: <FaShareAlt className="text-accent" />,
    title: "Share with Doctors",
    text: "Use simple Doctor IDs (DR-XXXX-1234) to share your profile securely.",
  },
  {
    icon: <FaHeart className="text-accent" />,
    title: "Manage Health Together",
    text: "Doctors can view your profile and add medical records after visits.",
  },
];

const testimonials = [
  {
    quote:
      "Finally, a simple way to share my complete health history with new doctors. No more carrying paper files!",
    name: "Sarah M.",
    role: "Patient",
  },
  {
    quote:
      "VitalLink makes it easy to access my patients' medical history and add visit notes securely.",
    name: "Dr. Johnson",
    role: "Family Physician",
  },
  {
    quote:
      "The AI assistant helped me understand my prescription better. Great feature for quick health questions.",
    name: "Mike R.",
    role: "Patient",
  },
];

const faqList = [
  {
    question: "Is my health data secure with VitalLink?",
    answer:
      "Yes! VitalLink uses Firebase's secure infrastructure with role-based access controls. Only doctors you explicitly share with can access your data.",
  },
  {
    question: "How do I share my profile with a doctor?",
    answer:
      "Ask your doctor for their unique Doctor ID (format: DR-XXXX-1234), then use the 'Share with Doctor' button on your profile to grant them access.",
  },
  {
    question: "Can doctors add medical records to my profile?",
    answer:
      "Yes, once you've shared your profile with a doctor, they can add medical records including diagnosis, symptoms, medications, and follow-up notes.",
  },
  {
    question: "Is VitalLink free to use?",
    answer:
      "Yes, VitalLink is currently free for both patients and healthcare providers. We're focused on building a great product first.",
  },
];

// ------------------------------ SMALL INLINE COMPONENTS ------------------------------
const SectionHeading = ({ eyebrow, title, sub }) => (
  <div className="mb-10 text-center max-w-3xl mx-auto">
    {eyebrow && (
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-block text-xs tracking-widest uppercase font-semibold text-accent/80 mb-3"
      >
        {eyebrow}
      </motion.span>
    )}
    <motion.h2
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-text to-text/70 dark:from-white dark:to-white/70 bg-clip-text text-transparent"
    >
      {title}
    </motion.h2>
    {sub && (
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-4 text-base md:text-lg text-secondary max-w-2xl mx-auto"
      >
        {sub}
      </motion.p>
    )}
  </div>
);

const FeatureCard = ({ feature, idx }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, delay: idx * 0.08 }}
      className="relative group rounded-2xl p-6 md:p-7 glass-elevated lift-on-hover shine-on-hover overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 via-surface/60 to-surface shadow-inner border border-white/10">
          {feature.icon}
        </span>
        <h3 className="text-xl font-semibold text-text dark:text-white">
          {feature.title}
        </h3>
      </div>
      <p className="text-secondary text-sm md:text-base mb-4 relative z-10">
        {feature.blurb}
      </p>
      <ul className="space-y-2 text-sm relative z-10">
        {feature.points.map((p, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-text/90 dark:text-white/90"
          >
            <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_0_3px_rgba(251,191,36,0.25)]" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div
        className={`pointer-events-none absolute -top-1/2 left-0 right-0 h-full blur-3xl opacity-50 bg-gradient-to-b ${feature.accent}`}
      />
    </motion.div>
  );
};

const JourneyStep = ({ step, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.55, delay: index * 0.1 }}
    className="relative flex flex-col gap-4 p-6 rounded-2xl glass-elevated lift-on-hover"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent/30 to-primary/30 text-accent text-xl font-bold border border-white/10 shadow-inner">
        {step.icon}
      </div>
      <div>
        <h4 className="font-semibold text-lg">{step.title}</h4>
        <p className="text-secondary text-sm mt-1">{step.text}</p>
      </div>
    </div>
    <span className="absolute -top-3 -right-3 text-[11px] px-2 py-1 rounded-full bg-gradient-to-r from-primary/40 to-accent/40 backdrop-blur-md border border-white/10 text-white/90 font-semibold shadow">
      {index + 1}
    </span>
  </motion.div>
);

const TestimonialCard = ({ t, idx }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.55, delay: idx * 0.08 }}
    className="relative rounded-2xl p-6 glass-elevated shine-on-hover"
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/15 via-transparent to-accent/20 opacity-60" />
    <div className="relative">
      <p className="text-sm md:text-base text-text/90 dark:text-white/90 leading-relaxed italic">
        "{t.quote}"
      </p>
      <div className="mt-5">
        <p className="font-semibold text-text dark:text-white">{t.name}</p>
        <p className="text-xs text-secondary tracking-wide">{t.role}</p>
      </div>
    </div>
  </motion.div>
);

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border soft-divider overflow-hidden backdrop-blur-sm bg-surface/60 dark:bg-surface/40 border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 text-left text-base md:text-lg font-semibold text-text dark:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
      >
        <span>{question}</span>
        <span className="text-accent text-xl leading-none">
          {open ? "−" : "+"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="faqcontent"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm md:text-base text-secondary leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LandingPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      if (userRole === "doctor") navigate("/doctor");
      else navigate("/user");
    } else navigate("/signup");
  };

  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <>
      <Navbar />
      <div className="aurora-bg min-h-screen w-full overflow-x-hidden text-text dark:text-white selection:bg-accent/30 selection:text-text">
        {/* ------------------------------ HERO ------------------------------ */}
        <section className="relative flex flex-col justify-center items-center min-h-[92vh] px-6 pt-28 md:pt-32 text-center">
          {/* Decorative orchestrated moving orbs */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute w-[38rem] h-[38rem] -top-40 -left-40 rounded-full bg-gradient-to-br from-primary/35 to-accent/20 blur-3xl opacity-40 animate-pulse" />
            <div className="absolute w-[30rem] h-[30rem] top-1/3 -right-40 rounded-full bg-gradient-to-tl from-accent/30 to-primary/20 blur-3xl opacity-40 animate-[pulse_9s_ease-in-out_infinite_alternate]" />
          </div>
          {/* Illustration removed (previous external SVG was failing to load) */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs tracking-wide font-medium text-accent shadow hover-glow-accent"
            >
              <FaLock className="text-accent" /> Secure • Share • Thrive
            </motion.span>
            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold leading-tight bg-[linear-gradient(92deg,var(--color-text),rgba(var(--primary-rgb)/0.85))] dark:bg-[linear-gradient(92deg,#fff,rgba(var(--primary-rgb)/0.85))] bg-clip-text text-transparent">
              Your Complete Health Profile, Digitized
            </h1>
            <p className="mt-6 text-base md:text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
              VitalLink helps patients create comprehensive health profiles and share them securely with doctors. Simple, secure, and always accessible.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="glass-cta px-7 py-3.5 text-base font-semibold shadow-lg hover:shadow-xl active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
              </button>
              <a
                href="#features"
                className="px-7 py-3.5 rounded-xl font-semibold text-sm md:text-base bg-white/70 dark:bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white/90 dark:hover:bg-white/10 transition-colors text-text dark:text-white lift-on-hover"
              >
                Explore Features
              </a>
            </div>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-[11px] md:text-xs text-secondary">
              {["Doctor ID System", "Profile Sharing", "Medical Records", "AI Assistant"].map((tag) => (
                <div
                  key={tag}
                  className="px-3 py-2 rounded-lg glass text-secondary/80 dark:text-secondary backdrop-blur-md border border-white/10"
                >
                  {tag}
                </div>
              ))}
            </div>
          </motion.div>
          {/* Minimal Scroll Arrow */}
          <motion.button
            type="button"
            onClick={() => {
              const el = document.getElementById("features");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.55 }}
            className="absolute bottom-8 md:bottom-10 w-10 h-10 rounded-full flex items-center justify-center text-accent hover:bg-accent/10 transition-all"
            aria-label="Scroll to features"
          >
            <svg
              className="w-5 h-5 animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        </section>

        {/* ------------------------------ FEATURE GRID ------------------------------ */}
        <section id="features" className="relative py-24 px-6">
          <SectionHeading
            eyebrow="Capabilities"
            title="Why Choose VitalLink?"
            sub="Everything you need to create, manage & securely share your health information with healthcare providers."
          />
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 xl:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <FeatureCard key={f.id} feature={f} idx={i} />
            ))}
            {/* Spotlight Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-2xl p-8 md:p-10 flex flex-col justify-between overflow-hidden glass-elevated col-span-full xl:col-span-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-primary/10 to-transparent" />
              <div className="relative">
                <h3 className="text-2xl font-bold mb-4 text-text dark:text-white flex items-center gap-3">
                  <FaLock className="text-accent" /> Built on Security
                </h3>
                <p className="text-secondary text-sm md:text-base leading-relaxed mb-6">
                  Your health data is protected with Firebase's enterprise-grade security, role-based access controls, and encrypted data transmission.
                </p>
                <ul className="grid grid-cols-1 gap-3 text-sm">
                  {["Firebase Authentication", "Role-based access control", "Encrypted data transmission", "Secure sharing permissions"].map((p) => (
                    <li key={p} className="flex items-center gap-2 text-text/90 dark:text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {["Firebase", "Secure", "GDPR Ready", "Encrypted"].map((b) => (
                  <span
                    key={b}
                    className="text-[11px] tracking-wide px-3 py-1 rounded-full glass border border-white/10 text-secondary/80"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ------------------------------ JOURNEY / HOW IT WORKS ------------------------------ */}
        <section className="relative py-28 px-6">
          <SectionHeading
            eyebrow="Workflow"
            title="Simple & Secure Health Management"
            sub="A straightforward process to create, maintain and share your health profile with healthcare providers."
          />
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {journeySteps.map((s, i) => (
              <JourneyStep key={s.title} step={s} index={i} />
            ))}
          </div>
        </section>

        {/* ------------------------------ TESTIMONIALS ------------------------------ */}
        <section className="relative py-24 px-6">
          <SectionHeading
            eyebrow="Voices"
            title="Trusted By Patients & Healthcare Providers"
            sub="Real experiences from people using VitalLink to manage their health information."
          />
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} t={t} idx={i} />
            ))}
          </div>
        </section>

        {/* ------------------------------ CTA ------------------------------ */}
        <section className="relative py-28 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden p-[1.5px] bg-gradient-to-br from-primary/40 via-accent/40 to-primary/10"
          >
            <div className="relative rounded-3xl p-10 md:p-16 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb)/0.25),rgba(var(--surface-rgb)/0.5)_60%)] backdrop-blur-xl border border-white/15">
              <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_60%)]" />
              <div className="text-center relative z-10">
                <MdOutlineHealthAndSafety className="text-5xl md:text-6xl text-accent mx-auto mb-6 drop-shadow" />
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                  Ready To Organize Your Health Information?
                </h2>
                <p className="text-secondary text-base md:text-lg mb-10 max-w-2xl mx-auto">
                  Create your comprehensive health profile today and share it securely with your healthcare providers when needed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleGetStarted}
                    className="glass-cta px-8 py-4 font-semibold text-base md:text-lg"
                  >
                    {user ? "Go To Dashboard" : "Create Your Account"}
                  </button>
                  <a
                    href="#faq"
                    className="px-8 py-4 rounded-xl font-semibold text-sm md:text-base bg-white/70 dark:bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white/90 dark:hover:bg-white/10 transition-colors text-text dark:text-white lift-on-hover"
                  >
                    Questions?
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ------------------------------ FAQ ------------------------------ */}
        <section id="faq" className="relative py-24 px-6">
          <SectionHeading
            eyebrow="Answers"
            title="Frequently Asked Questions"
            sub="Have more questions? Reach out after creating an account & we'll help." />
          <div className="max-w-4xl mx-auto space-y-4">
            {faqList.map((f, i) => (
              <FAQItem key={f.question} question={f.question} answer={f.answer} />
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
