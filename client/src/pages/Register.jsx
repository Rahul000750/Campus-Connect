import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/', { replace: true });
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/register', { name, email, password });
      // #region agent log
      fetch('http://127.0.0.1:7791/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'd57eee',
        },
        body: JSON.stringify({
          sessionId: 'd57eee',
          runId: 'post-fix',
          hypothesisId: 'verify_client_ok',
          location: 'client/src/pages/Register.jsx:submit:success',
          message: 'Register API returned success',
          data: { baseURL: api.defaults?.baseURL || null },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7791/ingest/66c0d595-13f9-432c-adf1-cbc80eb0fcac', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'd57eee',
        },
        body: JSON.stringify({
          sessionId: 'd57eee',
          runId: 'post-fix',
          hypothesisId: 'verify_client_err',
          location: 'client/src/pages/Register.jsx:submit:catch',
          message: 'Register request failed',
          data: {
            baseURL: api.defaults?.baseURL || null,
            hasResponse: !!error?.response,
            status: error?.response?.status || null,
            axiosCode: error?.code || null,
            axiosMessage: error?.message || null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      const serverMsg = error.response?.data?.message;
      const baseURL = api.defaults?.baseURL || 'unknown';
      if (!serverMsg && error?.message === 'Network Error') {
        setErr(
          `Cannot reach the API at ${baseURL}. Start MongoDB, then start the API (port 5174). Restart the Vite dev server after changing proxy or env.`
        );
      } else {
        setErr(serverMsg || error?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card shadow-sm mx-auto" style={{ maxWidth: 400 }}>
      <div className="card-body p-4">
        <h1 className="h4 mb-3">Register</h1>
        {err && <div className="alert alert-danger py-2">{err}</div>}
        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password (min 6)</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Please wait...' : 'Create account'}
          </button>
        </form>
        <p className="mt-3 mb-0 small text-center">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
