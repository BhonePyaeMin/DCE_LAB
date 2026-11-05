import { motion } from 'framer-motion';
import { CalendarDays, Package, QrCode } from 'lucide-react';
import logo from '../assets/logo.png';
import { fadeUp, staggerContainer } from '../animations/variants.js';

const POINTS = [
  { icon: CalendarDays, text: 'Reserve laboratories with conflict-free scheduling' },
  { icon: Package, text: 'Borrow and return equipment with a clear approval trail' },
  { icon: QrCode, text: 'Identify any item instantly with QR codes' },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden flex-col justify-between border-r border-slate-200 bg-white p-12 lg:flex">
        <img src={logo} alt="DCE Lab" className="h-16 w-auto self-start" />
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.h2 variants={fadeUp} className="max-w-md text-3xl font-bold leading-tight">
            Smarter laboratory management for the DCE department.
          </motion.h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <motion.li key={text} variants={fadeUp} className="flex items-center gap-3 text-slate-600">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-brand-50 text-brand-600">
                  <Icon size={18} />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </motion.div>
        <p className="text-xs text-slate-400">Digital and Communication Engineering - Mae Fah Luang University</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-md">
          <img src={logo} alt="DCE Lab" className="mx-auto mb-6 h-14 w-auto lg:hidden" />
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
          {footer && <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>}
        </motion.div>
      </div>
    </div>
  );
}
