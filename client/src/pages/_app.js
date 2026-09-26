import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import '../styles/globals.css';
import '../styles/landing.css';

const publicRoutes = ['/', '/login', '/register'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isPublic = publicRoutes.includes(router.pathname);
  return <>
    <Head><title>Agentflow AI | Operations</title><meta name="description" content="Agentic AI operations automation platform" /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
    {isPublic ? <Component {...pageProps} /> : <ProtectedRoute><Component {...pageProps} /></ProtectedRoute>}
  </>;
}
