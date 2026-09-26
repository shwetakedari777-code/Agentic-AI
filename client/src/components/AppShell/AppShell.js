import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Sparkles,
  GitBranch,
  PlayCircle,
  Puzzle,
  Settings,
  Bell,
  LogOut,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../services/socket';
import api from '../../services/api';

export default function AppShell({ children, title = 'Console' }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();

    // Listen to real-time notifications
    const handleNewNotif = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socketService.on('notification:new', handleNewNotif);
    socketService.on('notification:broadcast', handleNewNotif);

    // Socket status check
    const checkSocket = setInterval(() => {
      setIsSocketConnected(Boolean(socketService.socket?.connected));
    }, 2000);

    return () => {
      socketService.off('notification:new', handleNewNotif);
      socketService.off('notification:broadcast', handleNewNotif);
      clearInterval(checkSocket);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/clear');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('Failed to clear notifications:', e);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Builder', href: '/workflows/builder', icon: Sparkles, badge: 'AI' },
    { label: 'Workflows', href: '/workflows', icon: GitBranch },
    { label: 'Executions', href: '/executions', icon: PlayCircle },
    { label: 'Integrations', href: '/integrations', icon: Puzzle },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between z-20 select-none">
        <div>
          {/* Logo & Brand */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-[#0a0f1d] rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  Agentflow<span className="text-xs px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-mono">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Operations</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Real-Time Status & User Profile */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          {/* Socket.IO Heartbeat Indicator */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
            <span className="text-slate-400 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              Event Bus
            </span>
            <span className={`font-mono text-[11px] ${isSocketConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isSocketConnected ? 'LIVE' : 'POLLING'}
            </span>
          </div>

          {/* User Badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Operator'}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
                  <Shield className="w-2.5 h-2.5" />
                  {user?.role || 'operator'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-400 font-medium">Agentflow</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-100 font-semibold">{title}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: New Automation */}
            <Link
              href="/workflows/builder"
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Flow</span>
            </Link>

            {/* Notifications Bell */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#070b14]">
          {children}
        </main>
      </div>

      {/* Notifications Drawer */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md h-full bg-[#0d1326] border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-100">Audit & Alert Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-medium">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>All operational alerts clear</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isSuccess = notif.type === 'success';
                  const isEscalation = notif.type === 'escalation';
                  const isFailure = notif.type === 'failure';

                  return (
                    <div
                      key={notif._id || notif.id}
                      onClick={() => {
                        if (notif.executionId) {
                          router.push(`/executions/${notif.executionId}`);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        !notif.isRead
                          ? 'bg-slate-800/80 border-indigo-500/30 hover:border-indigo-400'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
                        {isEscalation && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
                        {isFailure && <AlertOctagon className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                        {!isSuccess && !isEscalation && !isFailure && <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />}

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{notif.title}</p>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                            {new Date(notif.createdAt || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
