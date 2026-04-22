import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getFriendlyApiError } from '../api';
import PageTransition from '../components/ui/PageTransition';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/', { replace: true });
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < 6) {
      setErr('Password must be at least 6 characters');
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/register', { name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      addToast('Account created successfully', 'success');
      navigate('/');
    } catch (error) {
      const message = getFriendlyApiError(error, 'Registration failed');
      setErr(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[72vh] w-full max-w-md items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card w-full p-6 sm:p-7"
        >
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Join and build your campus identity.</p>
          {err && (
            <div className="mt-4 rounded-2xl border border-rose-300/50 bg-rose-100/60 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
              {err}
            </div>
          )}
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Name</label>
            <input
              className="input-modern"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
            <input
              type="email"
              className="input-modern"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Password (min 6)</label>
            <input
              type="password"
              className="input-modern"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit" className="primary-btn mt-2 w-full" disabled={loading}>
              {loading ? 'Please wait...' : 'Create account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400">
              Login
            </Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
