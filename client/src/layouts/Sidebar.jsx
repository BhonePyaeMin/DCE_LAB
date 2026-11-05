import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV_ITEMS } from './navigation.js';

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} onClick={onNavigate} title={collapsed ? item.label : undefined} className="relative block">
      {({ isActive }) => (
        <span className={`relative flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${isActive ? 'text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'} ${collapsed ? 'justify-center' : ''}`}>
          {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 rounded bg-brand-50" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          {isActive && <motion.span layoutId="nav-bar" className="absolute inset-y-1.5 left-0 w-0.5 rounded bg-brand-600" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
          <Icon size={18} className="relative shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span key="label" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }} className="relative overflow-hidden whitespace-nowrap font-medium">
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}
    </NavLink>
  );
}

function SidebarContent({ collapsed, onToggle, onNavigate, onClose }) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(user.role));
  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 items-center border-b border-slate-200 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
        <img src={logo} alt="DCE Lab" className={collapsed ? 'h-8 w-8 object-cover object-left' : 'h-10 w-auto'} />
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Main navigation">
        {items.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
      {onToggle && (
        <button onClick={onToggle} className={`hidden items-center gap-3 border-t border-slate-200 px-6 py-3 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 lg:flex ${collapsed ? 'justify-center px-0' : ''}`} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  return (
    <>
      <motion.aside initial={false} animate={{ width: collapsed ? 72 : 244 }} transition={{ type: 'spring', stiffness: 380, damping: 36 }} className="sticky top-0 hidden h-screen shrink-0 border-r border-slate-200 bg-white lg:block">
        <SidebarContent collapsed={collapsed} onToggle={onToggle} />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40" onClick={onMobileClose} aria-hidden />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 380, damping: 38 }} className="absolute inset-y-0 left-0 w-64 bg-white shadow-pop">
              <SidebarContent collapsed={false} onNavigate={onMobileClose} onClose={onMobileClose} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
