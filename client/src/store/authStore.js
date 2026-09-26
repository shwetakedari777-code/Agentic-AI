import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import socketService from '../services/socket';

const useAuthStore = create(persist((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  setHydrated: () => set({ hydrated: true, isLoading: false, isAuthenticated: Boolean(get().token) }),
  initAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = get().token || window.localStorage.getItem('agentflow_token');
    if (!token) {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    set({ token, isAuthenticated: true, isLoading: false });
    const storedUser = window.localStorage.getItem('agentflow_user');
    if (storedUser && !get().user) {
      try { set({ user: JSON.parse(storedUser) }); } catch {}
    }
    socketService.connect(get().user?.id);
    try {
      const { data } = await api.get('/auth/me');
      if (data.data) {
        set({ user: data.data });
        window.localStorage.setItem('agentflow_user', JSON.stringify(data.data));
      }
    } catch (error) {
      if (error?.response?.status === 401) get().signOut();
    }
  },
  signIn: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: data.data.user, token: data.data.token, isAuthenticated: true, isLoading: false, error: null });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agentflow_token', data.data.token);
      window.localStorage.setItem('agentflow_user', JSON.stringify(data.data.user));
    }
    socketService.connect(data.data.user.id);
    return data.data.user;
  },
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    set({ user: data.data.user, token: data.data.token, isAuthenticated: true, isLoading: false, error: null });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('agentflow_token', data.data.token);
      window.localStorage.setItem('agentflow_user', JSON.stringify(data.data.user));
    }
    socketService.connect(data.data.user.id);
    return data.data.user;
  },
  login: async ({ email, password }) => {
    try { return { success: true, user: await get().signIn(email, password) }; }
    catch (error) { const message = error?.response?.data?.error || error.message; set({ error: message, isLoading: false }); return { success: false, error: message }; }
  },
  signOut: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('agentflow_token');
      window.localStorage.removeItem('agentflow_user');
    }
    socketService.disconnect();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
  },
  logout: () => get().signOut(),
  clearError: () => set({ error: null }),
}), {
  name: 'agentflow-auth',
  partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
  onRehydrateStorage: () => (state) => state?.setHydrated(),
}));

export { useAuthStore };
export default useAuthStore;
