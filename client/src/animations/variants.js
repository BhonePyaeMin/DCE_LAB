// Shared Framer Motion variants. Durations stay short so the interface feels responsive;
// <MotionConfig reducedMotion="user"> in main.jsx disables movement for users who ask for it.

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14, ease: 'easeIn' } },
};

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' } },
};

export const listItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -16, transition: { duration: 0.15 } },
};

export const modalOverlay = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.16 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const modalPanel = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 32 } },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.12 } },
};

export const dropdown = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.14, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } },
};

export const tap = { whileHover: { y: -1 }, whileTap: { scale: 0.97 } };
