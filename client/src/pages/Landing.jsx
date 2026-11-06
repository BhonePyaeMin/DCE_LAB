import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Cpu,
  FlaskConical,
  GraduationCap,
  Microscope,
  Package,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Undo2,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext.jsx';
import { Skeleton } from '../components/ui.jsx';
import { fadeUp, staggerContainer } from '../animations/variants.js';

const NAV = [
  { href: '#features', label: 'Features' },
  { href: '#workflow', label: 'How it works' },
  { href: '#roles', label: 'Roles' },
  { href: '#about', label: 'About' },
];

const FEATURES = [
  { icon: Package, title: 'Equipment inventory', text: 'Every item has a photo, a unique ID, live stock counts and a clear condition status.' },
  { icon: ClipboardList, title: 'Borrow and return', text: 'Request, approve, check out and return with a complete record of who has what.' },
  { icon: CalendarDays, title: 'Borrowing calendar', text: 'See pick-up and return dates at a glance so nothing is forgotten or double handled.' },
  { icon: QrCode, title: 'QR labels', text: 'Print a QR label per item and scan it to see availability and borrowing records instantly.' },
  { icon: Wrench, title: 'Damage reports', text: 'Report faults with photos and follow each repair from reported to resolved.' },
  { icon: ChartNoAxesCombined, title: 'Reports and alerts', text: 'Usage analytics, CSV exports, overdue reminders and real-time notifications.' },
];

const STEPS = [
  { icon: ClipboardList, title: 'Request', text: 'Browse the equipment and submit a borrowing request with your dates and purpose.' },
  { icon: ShieldCheck, title: 'Approve', text: 'The lab assistant or administrator reviews the request and reserves the stock.' },
  { icon: PackageCheck, title: 'Collect', text: 'Pick the item up at the laboratory. It is checked out to you and the due date starts.' },
  { icon: Undo2, title: 'Return', text: 'Return it on time. Its condition is verified and any damage opens a maintenance report.' },
];

const ROLES = [
  { icon: GraduationCap, title: 'Student', points: ['Browse equipment and borrow it', 'Track requests and return dates', 'Report damaged or faulty items'] },
  { icon: Users, title: 'Lecturer', points: ['Borrow equipment for teaching', 'Monitor student equipment usage', 'View reports and availability'] },
  { icon: UserCog, title: 'Lab Assistant', points: ['Approve and reject requests', 'Check equipment out and process returns', 'Update maintenance reports'] },
  { icon: ShieldCheck, title: 'Administrator', points: ['Manage inventory and laboratories', 'Manage users and permissions', 'Audit log and exportable reports'] },
];

const TEAM = [
  { name: 'Swan Htet', department: 'Digital and Communication Engineering', initials: 'SH' },
  { name: 'Bhone Pyae Min', department: 'Computer Engineering', initials: 'BP' },
];

/* ---------- loading skeleton (mirrors the hero layout) ---------- */

function LandingSkeleton() {
  const D = (props) => <Bone tone="dark" {...props} />;
  return (
    <motion.div key="skeleton" exit={{ opacity: 0, transition: { duration: 0.35 } }} className="fixed inset-0 z-50 overflow-hidden bg-slate-950" aria-busy="true" aria-label="Loading DCE Lab">
      <div className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6">
        <Skeleton className="h-9 w-28" />
        <div className="hidden gap-6 md:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-16">
        <D className="h-7 w-56" />
        <D className="mt-6 h-12 w-full max-w-3xl" />
        <D className="mt-3 h-12 w-3/5 max-w-xl" />
        <D className="mt-6 h-4 w-full max-w-xl" />
        <D className="mt-2 h-4 w-2/3 max-w-md" />
        <div className="mt-8 flex gap-3">
          <D brand className="h-11 w-44" />
          <D className="h-11 w-28" />
        </div>
        <div className="mt-14 hidden w-full max-w-4xl gap-4 sm:grid sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <D key={i} className="h-24" />
          ))}
        </div>
        <D className="mt-4 hidden h-48 w-full max-w-4xl sm:block" />
      </div>
    </motion.div>
  );
}

/** Keeps the loading skeleton on screen briefly so the page does not flash in (shorter for reduced motion). */
function useLandingReady(minMs = 1100) {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), reduce ? 200 : minMs);
    return () => clearTimeout(timer);
  }, [minMs, reduce]);
  return ready;
}

/* ---------- page sections (each one fills at least the viewport) ---------- */

function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`flex min-h-screen scroll-mt-0 items-center ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-6 py-24">{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <motion.div variants={fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-slate-600">{text}</p>}
    </motion.div>
  );
}

const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.2 } };

function Header() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Transparent glass over the dark hero, solid white once the page has scrolled.
  const shell = scrolled ? 'border-slate-200 bg-white/95 shadow-card backdrop-blur' : 'border-white/10 bg-slate-950/30 backdrop-blur-md';
  const link = scrolled ? 'text-slate-600 hover:text-brand-700' : 'text-white/75 hover:text-white';

  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${shell}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" aria-label="DCE Lab home" className={`rounded transition-colors duration-300 ${scrolled ? '' : 'bg-white px-2 py-1'}`}>
          <img src={logo} alt="DCE Lab" className="h-8 w-auto" />
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Page sections">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className={`text-sm font-medium transition-colors ${link}`}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Open dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className={`rounded px-3.5 py-2 text-sm font-medium transition-colors ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}>
                Sign in
              </Link>
              <Link to="/register" className="hidden rounded bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:inline-flex">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** A placeholder block that shimmers (tone="dark" for dark surfaces). */
function Bone({ className = '', brand = false, tone = 'light' }) {
  const look = tone === 'dark' ? `shimmer-dark ${brand ? 'shimmer-dark-brand' : ''}` : `shimmer ${brand ? 'shimmer-brand' : ''}`;
  return <div className={`${look} rounded ${className}`} aria-hidden />;
}

const BAR_HEIGHTS = [38, 62, 48, 80, 58, 92, 70, 52, 84, 66, 44, 76];

/** Glass wireframe of the dashboard made of shimmering skeleton blocks. */
function DashboardPreview() {
  const reduce = useReducedMotion();
  const B = (props) => <Bone tone="dark" {...props} />;
  return (
    <motion.div variants={fadeUp} className="relative mx-auto mt-16 w-full max-w-6xl" role="img" aria-label="Animated wireframe of the DCE Lab dashboard">
      {/* glow under the panel */}
      <div className="absolute -inset-x-6 -top-8 h-44 rounded-full bg-brand-600/30 blur-3xl" aria-hidden />

      <div className="relative overflow-hidden rounded-md border border-white/10 bg-slate-900/70 text-left shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" aria-hidden />
        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
            initial={{ left: '-40%' }}
            animate={{ left: '140%' }}
            transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity, repeatDelay: 5 }}
          />
        )}

        <div className="flex" aria-hidden>
          <aside className="hidden w-52 shrink-0 space-y-3 border-r border-white/10 p-4 md:block">
            <B className="mb-5 h-8 w-28" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <B brand={i === 0} className="h-5 w-5" />
                <B brand={i === 0} className={`h-3 ${['w-24', 'w-20', 'w-28', 'w-16', 'w-24', 'w-20', 'w-16'][i]}`} />
              </div>
            ))}
          </aside>

          <div className="min-w-0 flex-1 space-y-5 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <B className="h-5 w-40" />
                <B className="h-3 w-64 max-w-full" />
              </div>
              <B className="h-9 w-9 rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <B brand={i === 0} className="h-10 w-10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <B className="h-5 w-1/2" />
                    <B className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
                <B className="mb-4 h-4 w-44" />
                <div className="flex h-44 items-end gap-2 border-b border-white/10 pb-0.5">
                  {BAR_HEIGHTS.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.7 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                      style={{ height: `${h}%`, originY: 1 }}
                      className={`shimmer-dark flex-1 rounded-t-sm ${i === 5 ? 'shimmer-dark-brand' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-white/10 bg-white/[0.03] p-4">
                <B className="mb-1 h-4 w-32" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <B className="h-10 w-12 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <B className="h-3.5 w-4/5" />
                      <B className="h-3 w-1/2" />
                    </div>
                    <B className="h-5 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- hero background ---------- */

const FLOATERS = [
  { Icon: FlaskConical, className: 'left-[5%] top-[20%]', delay: 0, duration: 7 },
  { Icon: Cpu, className: 'right-[6%] top-[16%]', delay: 1.2, duration: 8 },
  { Icon: QrCode, className: 'left-[9%] top-[58%]', delay: 0.6, duration: 9 },
  { Icon: Package, className: 'right-[8%] top-[52%]', delay: 1.8, duration: 7.5 },
  { Icon: Microscope, className: 'left-[3%] top-[40%]', delay: 2.4, duration: 8.5 },
  { Icon: Wrench, className: 'right-[3%] top-[34%]', delay: 0.3, duration: 9.5 },
];

const AURORAS = [
  { className: '-left-32 -top-24 h-[34rem] w-[34rem] bg-brand-600/45', x: [0, 90, 20], y: [0, 60, 120], scale: [1, 1.2, 0.95], duration: 19 },
  { className: '-right-40 top-10 h-[38rem] w-[38rem] bg-rose-500/30', x: [0, -80, -20], y: [0, 90, 20], scale: [1.1, 0.9, 1.15], duration: 23 },
  { className: 'left-1/3 -bottom-48 h-[32rem] w-[32rem] bg-red-900/60', x: [0, 70, -60], y: [0, -50, 10], scale: [1, 1.25, 1], duration: 27 },
  { className: 'left-[55%] top-[8%] h-72 w-72 bg-amber-500/15', x: [0, -60, 40], y: [0, 40, -20], scale: [0.9, 1.15, 1], duration: 21 },
];

/** Animated stage behind the hero: aurora glows, a drifting grid, floating lab icons and a pointer spotlight. */
function HeroBackground({ sectionRef }) {
  const reduce = useReducedMotion();
  const mx = useSpring(useMotionValue(0), { stiffness: 90, damping: 24 });
  const my = useSpring(useMotionValue(0), { stiffness: 90, damping: 24 });
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${mx}px ${my}px, rgba(225, 56, 74, 0.2), transparent 65%)`;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const rect = el.getBoundingClientRect();
    mx.set(rect.width / 2);
    my.set(rect.height * 0.3);
    if (reduce) return undefined;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      mx.set(e.clientX - r.left);
      my.set(e.clientY - r.top);
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [sectionRef, reduce, mx, my]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      {AURORAS.map((a) => (
        <motion.div
          key={a.className}
          className={`absolute rounded-full mix-blend-screen blur-3xl will-change-transform ${a.className}`}
          animate={reduce ? undefined : { x: a.x, y: a.y, scale: a.scale }}
          transition={{ duration: a.duration, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
        />
      ))}

      <div className="hero-grid absolute inset-0" />
      <motion.div className="absolute inset-0" style={{ background: spotlight }} />

      {FLOATERS.map(({ Icon, className, delay, duration }) => (
        <motion.div
          key={className}
          className={`absolute hidden h-14 w-14 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-white/60 backdrop-blur-sm xl:flex ${className}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -16, 0], rotate: [-4, 5, -4] }}
          transition={{
            opacity: { delay: 1 + delay * 0.3, duration: 0.8 },
            scale: { delay: 1 + delay * 0.3, duration: 0.8 },
            y: { delay, duration, ease: 'easeInOut', repeat: Infinity },
            rotate: { delay, duration: duration * 1.2, ease: 'easeInOut', repeat: Infinity },
          }}
        >
          <Icon size={24} />
        </motion.div>
      ))}

      {/* vignette keeps the edges calm so the text stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,6,23,0.65)_100%)]" />
    </div>
  );
}

function Hero() {
  const { user } = useAuth();
  const sectionRef = useRef(null);
  return (
    <section ref={sectionRef} id="top" className="relative isolate flex min-h-screen justify-center overflow-hidden bg-slate-950 pt-16 text-white">
      <HeroBackground sectionRef={sectionRef} />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative mx-auto w-full max-w-7xl px-6 pb-24 pt-14 text-center sm:pt-20">
        <motion.p variants={fadeUp} className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          Laboratory and equipment management
        </motion.p>

        <motion.h1 variants={fadeUp} className="mx-auto mt-7 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-7xl">
          Smarter laboratory management for <span className="text-shimmer">DCE.</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          Browse equipment with photos, borrow and return with a clear approval trail, scan QR labels and keep every repair on record, all in one place.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-3">
          {user ? (
            <HeroLink to="/dashboard" primary>
              Open dashboard <ArrowRight size={18} />
            </HeroLink>
          ) : (
            <>
              <HeroLink to="/register" primary>
                Create an account <ArrowRight size={18} />
              </HeroLink>
              <HeroLink to="/login">Sign in</HeroLink>
            </>
          )}
        </motion.div>

        <motion.ul variants={fadeUp} className="mt-9 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-400">
          <li>
            <span className="font-semibold text-white">4</span> user roles
          </li>
          <li>
            <span className="font-semibold text-white">7</span> equipment categories
          </li>
          <li>
            <span className="font-semibold text-white">QR</span> item labels
          </li>
        </motion.ul>

        <DashboardPreview />
      </motion.div>
    </section>
  );
}

/** Hero call-to-action: the primary one glows and sweeps a highlight on hover. */
function HeroLink({ to, primary = false, children }) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="inline-flex">
      <Link
        to={to}
        className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-md px-6 py-3 font-medium transition-colors ${
          primary
            ? 'bg-brand-600 text-white shadow-[0_0_45px_-8px_rgba(225,56,74,0.9)] hover:bg-brand-500'
            : 'border border-white/20 bg-white/5 text-white backdrop-blur hover:bg-white/10'
        }`}
      >
        {primary && <span className="absolute inset-0 -translate-x-full skew-x-12 bg-white/25 transition-transform duration-700 group-hover:translate-x-full" aria-hidden />}
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </Link>
    </motion.div>
  );
}

function Features() {
  return (
    <Section id="features" className="bg-slate-50">
      <motion.div variants={staggerContainer} {...inView}>
        <SectionHeading eyebrow="Features" title="Everything the laboratory needs" text="Replace paper logs and chat messages with one organised system for equipment, people and maintenance." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <motion.article key={title} variants={fadeUp} whileHover={{ y: -3 }} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded bg-brand-50 text-brand-600">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}

function Workflow() {
  return (
    <Section id="workflow" className="bg-white">
      <motion.div variants={staggerContainer} {...inView}>
        <SectionHeading eyebrow="How it works" title="From request to return in four steps" text="Every step is recorded, so it is always clear who has which equipment and when it is due." />
        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <motion.li key={title} variants={fadeUp} className="relative rounded-md border border-slate-200 p-6">
              <span className="absolute -top-3 left-6 rounded bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">Step {i + 1}</span>
              <Icon size={26} className="mt-2 text-brand-600" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </motion.li>
          ))}
        </ol>
        <motion.p variants={fadeUp} className="mx-auto mt-12 max-w-2xl text-center text-sm text-slate-500">
          Overdue items are flagged automatically, reminders go out before the due date, and damaged returns are held out of stock until they are repaired.
        </motion.p>
      </motion.div>
    </Section>
  );
}

function Roles() {
  return (
    <Section id="roles" className="bg-slate-50">
      <motion.div variants={staggerContainer} {...inView}>
        <SectionHeading eyebrow="Roles" title="The right tools for everyone" text="Each role sees only what it needs, and permissions are enforced on the server." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map(({ icon: Icon, title, points }) => (
            <motion.article key={title} variants={fadeUp} whileHover={{ y: -3 }} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded bg-slate-100 text-slate-700">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}

function About() {
  return (
    <section id="about" className="flex min-h-screen flex-col bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-24">
        <motion.div variants={staggerContainer} {...inView} className="w-full">
          <SectionHeading eyebrow="About" title="Built by students, for the DCE laboratories" />
          <motion.p variants={fadeUp} className="mx-auto -mt-6 mb-14 max-w-2xl text-center text-slate-600">
            DCE Lab is a laboratory and equipment management system for the Digital and Communication Engineering department at Mae Fah Luang University. It was created to
            reduce manual paperwork, make equipment availability transparent and keep laboratory operations organised.
          </motion.p>

          <motion.h3 variants={fadeUp} className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
            Project credits
          </motion.h3>
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
            {TEAM.map((m) => (
              <motion.article key={m.name} variants={fadeUp} whileHover={{ y: -3 }} className="card flex items-center gap-4 p-6">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-brand-600 text-lg font-bold text-white" aria-hidden>
                  {m.initials}
                </span>
                <div>
                  <h4 className="text-lg font-semibold">{m.name}</h4>
                  <p className="text-sm text-slate-600">{m.department}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 sm:flex-row">
          <img src={logo} alt="DCE Lab" className="h-8 w-auto" />
          <p>Digital and Communication Engineering - Mae Fah Luang University</p>
          <p>{new Date().getFullYear()} DCE Lab</p>
        </div>
      </footer>
    </section>
  );
}

export default function Landing() {
  const ready = useLandingReady();

  return (
    <div className="bg-white">
      <AnimatePresence>{!ready && <LandingSkeleton />}</AnimatePresence>
      {ready && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
          <Header />
          <main>
            <Hero />
            <Features />
            <Workflow />
            <Roles />
            <About />
          </main>
        </motion.div>
      )}
    </div>
  );
}
