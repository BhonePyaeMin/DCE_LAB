import { useState } from 'react';
import api, { errorMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, Field, PageHeader } from '../components/ui.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { ROLE_LABEL } from '../utils/format.js';

export default function Settings() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({ name: user.name, identifier: user.identifier || '', department: user.department || '', phone: user.phone || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/me', profile);
      setUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return toast.error('The new passwords do not match');
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and password." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Email" hint="Your email is your sign-in name and cannot be changed.">
              <input className="input" value={user.email} disabled />
            </Field>
            <div>
              <span className="label">Role</span>
              <StatusBadge status={user.role} label={ROLE_LABEL[user.role]} />
            </div>
            <Field label="Full name">
              <input className="input" required minLength={2} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Student / staff ID">
                <input className="input" value={profile.identifier} onChange={(e) => setProfile({ ...profile, identifier: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Department">
              <input className="input" value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
            </Field>
            <Button type="submit" loading={savingProfile}>
              Save profile
            </Button>
          </form>
        </Card>

        <Card title="Change password">
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Current password">
              <input className="input" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <input className="input" type="password" autoComplete="new-password" required minLength={8} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
            </Field>
            <Field label="Confirm new password">
              <input className="input" type="password" autoComplete="new-password" required value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            </Field>
            <Button type="submit" loading={savingPassword}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
