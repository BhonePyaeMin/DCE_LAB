import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import { FullPageSpinner, GuestRoute, ProtectedRoute } from './routes/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';

// Heavier pages load on demand so the first paint stays fast.
const Laboratories = lazy(() => import('./pages/Laboratories.jsx'));
const Reservations = lazy(() => import('./pages/Reservations.jsx'));
const Equipment = lazy(() => import('./pages/Equipment.jsx'));
const Borrowings = lazy(() => import('./pages/Borrowings.jsx'));
const Maintenance = lazy(() => import('./pages/Maintenance.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Users = lazy(() => import('./pages/Users.jsx'));
const ActivityLogs = lazy(() => import('./pages/ActivityLogs.jsx'));
const SettingsPage = lazy(() => import('./pages/Settings.jsx'));
const Scan = lazy(() => import('./pages/Scan.jsx'));

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="laboratories" element={<Laboratories />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="borrowings" element={<Borrowings />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="scan" element={<Scan />} />
            <Route path="scan/:code" element={<Scan />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route element={<ProtectedRoute roles={['admin', 'lecturer']} />}>
              <Route path="analytics" element={<Analytics />} />
            </Route>
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="users" element={<Users />} />
              <Route path="activity" element={<ActivityLogs />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
