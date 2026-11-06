import {
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  ClipboardSignature,
  FlaskConical,
  LayoutDashboard,
  Package,
  QrCode,
  ScrollText,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';

// `roles` omitted = visible to everyone.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/laboratories', label: 'Laboratories', icon: FlaskConical },
  { to: '/equipment', label: 'Equipment', icon: Package },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/counter', label: 'Lab counter', icon: ClipboardSignature, roles: ['admin', 'assistant'] },
  { to: '/borrowings', label: 'Borrowing', icon: ClipboardList },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/scan', label: 'QR Scanner', icon: QrCode },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined, roles: ['admin', 'lecturer', 'assistant'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/activity', label: 'Activity Log', icon: ScrollText, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: Settings },
];
