import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Puzzle,
  Mail,
  MessageSquare,
  Radio,
  Table,
  Sparkles,
  CheckCircle2,
  XCircle,
  Key,
  ExternalLink,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import api from '../services/api';

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [manualModal, setManualModal] = useState(null); // provider being manually configured
  const [manualToken, setManualToken] = useState('');
  const [manualAccount, setManualAccount] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/integrations');
      if (res.data?.data) {
        setIntegrations(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load integrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
    if (router.query.connected) {
      setFeedbackMsg(`Successfully connected to ${router.query.connected}!`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
    if (router.query.error) {
      setFeedbackMsg(`Authentication notice: ${router.query.error}`);
    }
  }, [router.query]);

  const handleOAuthConnect = (providerId) => {
    window.location.href = `http://localhost:5000/api/integrations/oauth/${providerId}/start`;
  };

  const handleDisconnect = async (providerId) => {
    if (!confirm(`Disconnect ${providerId}?`)) return;
    try {
      await api.delete(`/integrations/${providerId}`);
      loadIntegrations();
    } catch (err) {
      alert('Failed to disconnect integration');
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualModal) return;

    try {
      await api.post('/integrations', {
        provider: manualModal.id,
        credentials: { accessToken: manualToken },
        accountInfo: { account: manualAccount || 'Operator Configured' },
      });
      setManualModal(null);
      setManualToken('');
      setManualAccount('');
      loadIntegrations();
      setFeedbackMsg(`Custom credentials stored for ${manualModal.name}`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save credentials');
    }
  };

  const getProviderIcon = (id) => {
    switch (id) {
      case 'gmail':
        return <Mail className="w-5 h-5 text-red-400" />;
      case 'slack':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'discord':
        return <Radio className="w-5 h-5 text-indigo-400" />;
      case 'google-sheets':
        return <Table className="w-5 h-5 text-green-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Integration Hub">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Third-Party OAuth Connectors
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Encrypted at rest with AES-256-GCM. Missing credentials trigger explicit recovery protocols.
              </p>
            </div>

            <button
              onClick={loadIntegrations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors w-fit"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          {feedbackMsg && (
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {integrations.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#0c1222] border border-slate-800 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        {getProviderIcon(item.id)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.isConnected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Connected & Authorized
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Not Connected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      OAuth 2.0
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Scopes */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.requiredScopes?.map((scope, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800/80 truncate max-w-xs"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setManualModal(item)}
                    className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>API Key / Webhook</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {item.isConnected ? (
                      <button
                        onClick={() => handleDisconnect(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOAuthConnect(item.id)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Connect OAuth</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Security Notice Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200">Credential Security Protocol</h4>
              <p className="mt-0.5 leading-relaxed">
                OAuth access tokens and refresh tokens are encrypted at rest with AES-256-GCM using your application-level master encryption key. Decrypted tokens are never written to logs or transmitted across client telemetry streams.
              </p>
            </div>
          </div>
        </div>

        {/* Manual Key Modal */}
        {manualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#0d1326] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">
                  Configure {manualModal.name} Credentials
                </h3>
                <button
                  onClick={() => setManualModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Enter an API token, bot token, or incoming webhook URL. This credential will be encrypted with AES-256 and stored securely.
              </p>

              <form onSubmit={handleSaveManual} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Account Label</label>
                  <input
                    type="text"
                    value={manualAccount}
                    onChange={(e) => setManualAccount(e.target.value)}
                    placeholder="e.g. Production Workspace"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Token / Webhook Secret
                  </label>
                  <input
                    type="password"
                    required
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Bearer token or Webhook URL"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setManualModal(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                  >
                    Save Encrypted
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
