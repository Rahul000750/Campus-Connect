import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
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
    setLoading(true);
    // #region agent log
    fetch('http://127.0.0.1:7344/ingest/36f1c759-e85b-4c6f-af35-22613d633138',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de59f0'},body:JSON.stringify({sessionId:'de59f0',runId:'baseline',hypothesisId:'H4_client_baseurl_mismatch',location:'client/src/pages/Login.jsx:submit:before_request',message:'Client about to call /login',data:{appOrigin:window.location.origin,apiBaseURL:api.defaults?.baseURL||null,email:typeof email==='string'?email.trim().toLowerCase():null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
      const { data } = await api.post('/login', { email, password });
      // #region agent log
      fetch('http://127.0.0.1:7344/ingest/36f1c759-e85b-4c6f-af35-22613d633138',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de59f0'},body:JSON.stringify({sessionId:'de59f0',runId:'baseline',hypothesisId:'H4_client_baseurl_mismatch',location:'client/src/pages/Login.jsx:submit:success',message:'Client received login success',data:{appOrigin:window.location.origin,apiBaseURL:api.defaults?.baseURL||null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7344/ingest/36f1c759-e85b-4c6f-af35-22613d633138',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'de59f0'},body:JSON.stringify({sessionId:'de59f0',runId:'baseline',hypothesisId:'H4_client_baseurl_mismatch',location:'client/src/pages/Login.jsx:submit:catch',message:'Client login request failed',data:{appOrigin:window.location.origin,apiBaseURL:api.defaults?.baseURL||null,hasResponse:!!error?.response,status:error?.response?.status||null,axiosCode:error?.code||null,axiosMessage:error?.message||null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setErr(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card shadow-sm mx-auto" style={{ maxWidth: 400 }}>
      <div className="card-body p-4">
        <h1 className="h4 mb-3">Login</h1>
        {err && <div className="alert alert-danger py-2">{err}</div>}
        <form onSubmit={submit}>
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
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Please wait...' : 'Login'}
          </button>
        </form>
        <p className="mt-3 mb-0 small text-center">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
