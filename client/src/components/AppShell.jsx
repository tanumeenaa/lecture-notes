import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, GraduationCap, LayoutDashboard, LogOut, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/subjects', label: 'Subjects', icon: GraduationCap },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/notebook', label: 'Notebooks', icon: BookOpen },
  { to: '/search', label: 'Search notes', icon: Search }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const current = links.find((link) => location.pathname.startsWith(link.to));

  function signOut() {
    logout();
    navigate('/login');
  }

  return <div className="app-frame">
    <aside className="sidebar">
      <NavLink to="/dashboard" className="brand-lockup">
        <span className="brand-mark"><Sparkles size={17} strokeWidth={2.2} /></span>
        <span>LECTURE<span className="brand-light">/</span>NOTES</span>
      </NavLink>
      <div className="nav-caption">STUDY SPACE</div>
      <nav className="side-nav">
        {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
        </NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><span className="note-dot" />Your notes stay yours</div>
        <button className="profile-button" onClick={signOut} title="Sign out">
          <span className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</span>
          <span className="profile-copy"><strong>{user?.name}</strong><small>{user?.email}</small></span>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <div className="mobile-brand"><span className="brand-mark"><Sparkles size={16} /></span> LECTURE/NOTES</div>
        <div className="breadcrumb">STUDY SPACE <span>/</span> {current?.label?.toUpperCase() ?? 'LECTURE'}</div>
        <div className="topbar-date">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</div>
      </header>
      <main className="page-content"><Outlet /></main>
      <nav className="mobile-nav">
        {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} aria-label={label} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={19} /></NavLink>)}
      </nav>
    </div>
  </div>;
}