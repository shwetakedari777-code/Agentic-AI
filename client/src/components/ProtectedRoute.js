import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { token, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !token) router.replace('/login');
  }, [hydrated, token, router]);

  if (!hydrated || !token) return <main className="boot-screen"><span className="brand-mark">A</span><p>Opening Agentflow</p></main>;
  return children;
}