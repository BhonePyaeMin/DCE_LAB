import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../services/api.js';
import { Button, Field } from '../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', identifier: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '')));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Students and lecturers can register. Administrator accounts are created by lab staff."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800" role="alert">
            {error}
          </div>
        )}
        <Field label="Full name">
          <input className="input" required value={form.name} onChange={set('name')} autoComplete="name" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="I am a">
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </Field>
          <Field label={form.role === 'student' ? 'Student ID' : 'Staff ID'}>
            <input className="input" value={form.identifier} onChange={set('identifier')} />
          </Field>
        </div>
        <Field label="Email">
          <input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input className="input" type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" />
        </Field>
        <Button type="submit" icon={UserPlus} loading={loading} className="w-full" disabled={!form.name || !form.email || !form.password}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
