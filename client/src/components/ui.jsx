import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 disabled:text-brand-300',
  ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
};

const SIZES = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm' };

export function Button({ variant = 'primary', size = 'md', icon: Icon, loading, children, className = '', disabled, ...props }) {
  return (
    <motion.button
      whileHover={disabled || loading ? undefined : { y: -1 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </motion.button>
  );
}

export function IconButton({ icon: Icon, label, className = '', ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 ${className}`}
      {...props}
    >
      <Icon size={17} />
    </motion.button>
  );
}

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-brand-700">{error}</p>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', padded = true }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {actions}
        </header>
      )}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded bg-slate-100 text-slate-400">
          <Icon size={22} />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200/70 ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-5" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-slate-400 ${className}`} size={20} />;
}

export function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return total ? <p className="px-4 py-3 text-xs text-slate-500">{total} record{total === 1 ? '' : 's'}</p> : null;
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
      <span className="text-xs text-slate-500">{total} records</span>
      <div className="flex items-center gap-2">
        <IconButton icon={ChevronLeft} label="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)} />
        <span className="text-xs text-slate-600">
          Page {page} of {pages}
        </span>
        <IconButton icon={ChevronRight} label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)} />
      </div>
    </div>
  );
}

/** Pill-less segmented control used for filters and view switches. */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex overflow-x-auto rounded border border-slate-300 bg-white p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`relative whitespace-nowrap rounded-sm px-3 py-1.5 text-sm transition-colors ${active ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {active && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-sm bg-brand-600" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline">
          Retry
        </button>
      )}
    </div>
  );
}
