import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Activity, ArrowRight, Blocks, GitBranch, ShieldCheck, Zap } from 'lucide-react';
import useAuthStore from '../store/authStore';

const agents = [
  ['01', 'Planner', 'Maps dependencies and orders each action.'],
  ['02', 'Execution', 'Runs steps through connected providers.'],
  ['03', 'Validation', 'Checks outputs against required fields.'],
  ['04', 'Recovery', 'Retries transient errors, escalates the rest.'],
  ['05', 'Monitoring', 'Records and streams every agent event.'],
];

export default function Home() {
  const router = useRouter();
  const { token, hydrated } = useAuthStore();
  useEffect(() => { if (hydrated && token) router.replace('/dashboard'); }, [hydrated, token, router]);

  return <main className="landing-page">
    <header className="landing-nav"><Link href="/" className="brand-lockup"><span className="brand-mark">A</span><span>agentflow<span className="brand-dot">.</span><small>AI OPERATIONS</small></span></Link><div><Link href="/login" className="landing-signin">Sign in</Link><Link href="/register" className="button primary">Create account <ArrowRight size={14} /></Link></div></header>
    <section className="landing-hero"><div className="landing-copy"><span className="eyebrow">THE AGENTIC OPERATIONS PLATFORM</span><h1>From plain language<br />to <em>work in motion.</em></h1><p>Describe a process. Shape it into a visual workflow. Let a coordinated team of AI agents run, validate, and audit every step.</p><div className="landing-actions"><Link href="/register" className="button primary">Start building <ArrowRight size={15} /></Link><Link href="/login" className="button">Open operator console</Link></div><div className="landing-proof"><span><i />5 cooperating agents</span><span><i />4 live integrations</span><span><i />Full execution audit</span></div></div><div className="landing-visual"><div className="visual-top"><span><Activity size={14} /> AGENT CHAIN</span><span className="live-label"><i /> READY</span></div><div className="visual-flow"><div className="flow-trigger"><Zap size={15} /><span>New event</span><small>TRIGGER</small></div><div className="flow-connector" /><div className="flow-task"><GitBranch size={15} /><span>Plan workflow</span><small>PLANNER AGENT</small></div><div className="flow-connector" /><div className="flow-task task-green"><ShieldCheck size={15} /><span>Validate output</span><small>VALIDATION AGENT</small></div><div className="flow-connector" /><div className="flow-result"><Blocks size={15} /><span>Notify team</span><small>SLACK · CONNECTED</small></div></div><div className="visual-foot"><span><i /> EXECUTION TRACE</span><span>Ready for input <ArrowRight size={13} /></span></div></div></section>
    <section className="landing-agents"><div className="agents-heading"><span className="eyebrow">COOPERATIVE BY DESIGN</span><h2>Five agents. One accountable run.</h2></div><div className="agent-strip">{agents.map(([number, title, description]) => <article key={title}><span className="agent-number">{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <footer className="landing-footer"><span>AGENTFLOW_AI</span><span>Operations, made observable.</span></footer>
  </main>;
}
