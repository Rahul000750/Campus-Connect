import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-3">
      <div className="container-fluid" style={{ maxWidth: 720 }}>
        <Link className="navbar-brand" to={token ? '/' : '/login'}>
          CampusConnect
        </Link>
        {token ? (
          <div className="navbar-nav ms-auto flex-row gap-2 align-items-center">
            <Link className="nav-link text-white" to="/">
              Feed
            </Link>
            <Link className="nav-link text-white" to="/profile">
              Profile
            </Link>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="navbar-nav ms-auto flex-row gap-2">
            <Link className="nav-link text-white" to="/login">
              Login
            </Link>
            <Link className="nav-link text-white" to="/register">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
