import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  GraduationCap,
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
  return (
    <motion.div key="skeleton" exit={{ opacity: 0, transition: { duration: 0.3 } }} className="fixed inset-0 z-50 overflow-hidden bg-white" aria-busy="true" aria-label="Loading DCE Lab">
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
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
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-12 w-full max-w-lg" />
          <Skeleton className="h-12 w-4/5 max-w-md" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-3/4 max-w-md" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
        <div className="relative mx-auto hidden w-full max-w-xl pb-16 pt-6 lg:block">
          <div className="ml-auto w-[88%] overflow-hidden rounded-md border border-slate-100">
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="absolute left-0 top-12 h-20 w-56" />
          <Skeleton className="absolute bottom-0 left-4 h-16 w-52" />
          <Skeleton className="absolute bottom-2 right-6 h-16 w-48" />
        </div>
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'border-slate-200 shadow-card' : 'border-transparent'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" aria-label="DCE Lab home">
          <img src={logo} alt="DCE Lab" className="h-9 w-auto" />
        </a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Page sections">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-700">
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
              <Link to="/login" className="rounded px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
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

/** A placeholder block that shimmers. */
function Bone({ className = '', brand = false }) {
  return <div className={`shimmer ${brand ? 'shimmer-brand' : ''} rounded ${className}`} aria-hidden />;
}

/** Layered wireframe of the app built from shimmering skeleton blocks: a main card with three cards overlapping it. */
function HeroShowcase() {
  const float = 'card absolute hidden shadow-pop sm:block';
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative mx-auto w-full max-w-xl pb-24 pt-6 lg:max-w-none" role="img" aria-label="Animated preview of the DCE Lab interface loading">
      <div className="absolute right-0 top-0 h-[88%] w-[84%] rounded-md bg-brand-50" aria-hidden />

      <motion.div variants={fadeUp} className="card relative ml-auto w-full overflow-hidden shadow-pop sm:w-[88%]" aria-hidden>
        <Bone className="aspect-[16/10] w-full rounded-none" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-2/5" />
              <Bone className="h-3 w-3/5" />
            </div>
            <Bone className="h-6 w-14" />
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex justify-between">
              <Bone className="h-4 w-1/3" />
              <Bone className="h-3 w-16" />
            </div>
            <Bone className="h-2 w-full" />
          </div>
          <Bone brand className="mt-5 h-10 w-full" />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className={`${float} -left-4 top-14 w-60 p-3 xl:-left-10`} aria-hidden>
        <div className="flex items-center gap-3">
          <Bone className="h-12 w-16 shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-4/5" />
            <Bone className="h-3 w-3/5" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <Bone className="h-3 w-20" />
          <Bone className="h-5 w-16" />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className={`${float} -bottom-2 left-0 flex w-56 items-center gap-3 p-3 xl:-left-6`} aria-hidden>
        <Bone className="h-11 w-11 shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-4/5" />
          <Bone className="h-3 w-1/2" />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className={`${float} -bottom-6 right-2 flex w-60 items-start gap-3 p-3`} aria-hidden>
        <Bone className="h-9 w-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-3/5" />
          <Bone className="h-3 w-full" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Hero() {
  const { user } = useAuth();
  return (
    <section id="top" className="flex min-h-screen items-center overflow-x-clip bg-white pt-16">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="inline-flex items-center gap-2 rounded border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            <Bell size={14} /> Laboratory and equipment management
          </motion.p>
          <motion.h1 variants={fadeUp} className="mt-5 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Smarter laboratory management for DCE.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-lg text-slate-600">
            Browse equipment with photos, borrow and return with a clear approval trail, scan QR labels and keep every repair on record, all in one place.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700">
                Open dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="inline-flex items-center gap-2 rounded bg-brand-600 px-5 py-3 font-medium text-white hover:bg-brand-700">
                  Create an account <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="inline-flex items-center rounded border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-50">
                  Sign in
                </Link>
              </>
            )}
          </motion.div>
          <motion.dl variants={fadeUp} className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200 pt-6">
            {[
              ['4', 'user roles'],
              ['7', 'equipment categories'],
              ['QR', 'item labels'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-2xl font-bold text-slate-900">{value}</dt>
                <dd className="text-sm text-slate-500">{label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <HeroShowcase />
      </div>
    </section>
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
