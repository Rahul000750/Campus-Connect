import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiBell,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageCircle,
  FiSearch,
  FiUser,
  FiX,
  FiMoon,
  FiSun,
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const token = localStorage.getItem('token');

  const navItems = useMemo(
    () => [
      { label: 'Home', to: '/', icon: FiHome },
      { label: 'Messages', to: '/', icon: FiMessageCircle },
      { label: 'Alerts', to: '/', icon: FiBell },
      { label: 'Profile', to: '/profile', icon: FiUser },
    ],
    []
  );

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
      <nav className="glass-card mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-2 sm:px-4">
        <Link className="flex items-center gap-2" to={token ? '/' : '/login'}>
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-2 py-1 text-xs font-semibold text-white">
            CC
          </div>
          <span className="text-sm font-semibold tracking-wide sm:text-base">CampusConnect</span>
        </Link>

        {token && (
          <div className="hidden flex-1 px-6 md:block">
            <label className="relative block">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-modern py-2 pl-10" placeholder="Search people, posts, communities..." />
            </label>
          </div>
        )}

        <div className="hidden items-center gap-2 md:flex">
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>

          {token ? (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.label}
                    className={`icon-btn ${active ? 'border-blue-400 text-blue-600 dark:border-blue-500 dark:text-blue-400' : ''}`}
                    to={item.to}
                    title={item.label}
                  >
                    <Icon />
                  </Link>
                );
              })}
              <button type="button" className="icon-btn" onClick={logout} title="Logout">
                <FiLogOut />
              </button>
            </>
          ) : (
            <>
              <Link className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800" to="/login">
                Login
              </Link>
              <Link className="primary-btn text-sm" to="/register">
                Register
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <button type="button" className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-card mx-auto mt-2 w-full max-w-7xl p-3 md:hidden"
          >
            <div className="space-y-2">
              {token ? (
                <>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800" to="/login">
                    Login
                  </Link>
                  <Link className="block rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800" to="/register">
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
