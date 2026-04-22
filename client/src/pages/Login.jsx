import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { getFriendlyApiError } from '../api';
import PageTransition from '../components/ui/PageTransition';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
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
    setLoading(true);
    try {
      const { data } = await api.post('/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      addToast('Welcome back', 'success');
      navigate('/');
    } catch (error) {
      const message = getFriendlyApiError(error, 'Login failed');
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
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Login to continue your network journey.</p>
          {err && (
            <div className="mt-4 rounded-2xl border border-rose-300/50 bg-rose-100/60 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
            <input
              type="email"
              className="input-modern"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Password</label>
            <input
              type="password"
              className="input-modern"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="primary-btn mt-2 w-full" disabled={loading}>
              {loading ? 'Please wait...' : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No account?{' '}
            <Link to="/register" className="font-medium text-blue-600 dark:text-blue-400">
              Register
            </Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
