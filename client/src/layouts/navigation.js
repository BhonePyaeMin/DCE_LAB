import {
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
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
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/laboratories', label: 'Laboratories', icon: FlaskConical },
  { to: '/reservations', label: 'Reservations', icon: CalendarDays },
  { to: '/equipment', label: 'Equipment', icon: Package },
  { to: '/borrowings', label: 'Borrowing', icon: ClipboardList },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/scan', label: 'QR Scanner', icon: QrCode },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined, roles: ['admin', 'lecturer'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/activity', label: 'Activity Log', icon: ScrollText, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: Settings },
];
