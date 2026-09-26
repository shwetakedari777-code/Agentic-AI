import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Activity, Bell, Blocks, ChevronDown, CircleHelp, Command, LayoutDashboard, LogOut, Menu, Settings, Workflow, X } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import useAuthStore from '../store/authStore';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/workflows', label: 'Workflows', icon: Workflow },
  { href: '/executions', label: 'Executions', icon: Activity },
  { href: '/integrations', label: 'Integrations', icon: Blocks },
];

export default function AppShell({ children, title, eyebrow = 'Operations' }) {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [noticeError, setNoticeError] = useState('');

  useEffect(() => {
    if (!drawerOpen) return;
    api.get('/notifications').then(({ data }) => setNotifications(data.data || [])).catch((error) => setNoticeError(getErrorMessage(error)));
  }, [drawerOpen]);

  const logout = () => {
    signOut();
    router.push('/login');
  };

  return <div className="app-frame">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <Link href="/dashboard" className="brand-lockup"><span className="brand-mark">A</span><span>agentflow<span className="brand-dot">.</span><small>AI OPERATIONS</small></span></Link>
      <div className="workspace-label">WORKSPACE <ChevronDown size={13} /></div>
      <div className="workspace-select"><span className="workspace-avatar">{user?.name?.slice(0, 1) || 'A'}</span><span>{user?.name || 'Operator workspace'}<small>Personal workspace</small></span><ChevronDown size={15} /></div>
      <div className="nav-caption">CONTROL ROOM</div>
      <nav className="side-nav">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-link ${router.pathname === href || (href !== '/dashboard' && router.pathname.startsWith(`${href}/`)) ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8} />{label}{href === '/executions' && <span className="nav-live-dot" />}</Link>)}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-status"><span className="status-pip" />All systems operational<span className="status-count">5/5</span></div>
      <Link href="/settings" className={`nav-link ${router.pathname === '/settings' ? 'active' : ''}`}><Settings size={17} />Settings</Link>
      <button className="profile-row" onClick={logout}><span className="profile-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'O'}</span><span className="profile-info">{user?.name || 'Operator'}<small>{user?.role || 'operator'}</small></span><LogOut size={15} /></button>
    </aside>
    {mobileOpen && <button aria-label="Close menu" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
    <main className="main-area">
      <header className="topbar"><button aria-label="Open menu" className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><div className="breadcrumbs"><span>{eyebrow}</span><span className="crumb-slash">/</span><strong>{title}</strong></div><div className="topbar-actions"><span className="env-pill"><span />LOCAL ENVIRONMENT</span><button aria-label="Notifications" className={`icon-button notification-button ${drawerOpen ? 'selected' : ''}`} onClick={() => setDrawerOpen(!drawerOpen)}><Bell size={18} />{notifications.some((item) => !item.isRead) && <i />}</button><span className="topbar-divider" /><div className="topbar-avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'O'}</div></div></header>
      <div className="page-content">{children}</div>
    </main>
    {drawerOpen && <><button className="drawer-scrim" aria-label="Close notifications" onClick={() => setDrawerOpen(false)} /><aside className="notification-drawer"><div className="drawer-heading"><div><span className="eyebrow">ACTIVITY</span><h2>Notifications</h2></div><button className="icon-button" aria-label="Close" onClick={() => setDrawerOpen(false)}><X size={18} /></button></div>{noticeError && <div className="inline-error">{noticeError}</div>}{notifications.length ? notifications.map((item) => <article className={`notification-item ${item.isRead ? 'is-read' : ''}`} key={item._id}><span className={`notification-symbol ${item.type === 'failure' ? 'failure' : ''}`}><Activity size={15} /></span><div><strong>{item.title}</strong><p>{item.message}</p><time>{new Date(item.createdAt).toLocaleString()}</time></div></article>) : <div className="empty-state compact"><Bell size={20} /><p>You’re all caught up.</p></div>}<div className="drawer-footer"><Command size={14} />AGENTFLOW ACTIVITY</div></aside></>}
    <div className="help-float"><CircleHelp size={14} /> Help center</div>
  </div>;
}