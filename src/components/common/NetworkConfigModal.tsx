import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  WifiOff,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Radio,
  ExternalLink,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, checkServerHealth } from '../../services/api';
import { getNetworkStatus, subscribeNetworkStatus } from '../../services/nativeApp';
import { useApp } from '../../context/AppContext';

interface NetworkConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkConfigModal: React.FC<NetworkConfigModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();

  const [apiUrlInput, setApiUrlInput] = useState('');
  const [networkInfo, setNetworkInfo] = useState<{ connected: boolean; connectionType: string }>({
    connected: true,
    connectionType: 'wifi',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    connected: boolean;
    latencyMs: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiUrlInput(getApiBaseUrl());
      getNetworkStatus().then(setNetworkInfo);
      const unsubscribe = subscribeNetworkStatus(setNetworkInfo);
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await checkServerHealth(apiUrlInput);
      setTestResult({
        tested: true,
        connected: res.connected,
        latencyMs: res.latencyMs,
        error: res.error,
      });

      if (res.connected) {
        showToast('success', 'Server Reachable', `Connected in ${res.latencyMs}ms`);
      } else {
        showToast('error', 'Connection Failed', res.error || 'Server did not respond.');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(apiUrlInput);
    showToast('success', 'Network Settings Saved', `Active API Endpoint: ${apiUrlInput || '/api'}`);
    onClose();
  };

  const setPreset = (url: string) => {
    setApiUrlInput(url);
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 transition-all transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-tight">Internet & Network Settings</h2>
              <p className="text-[11px] text-slate-500">Live API Server & Network Connectivity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Real-time Internet Status Card */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              networkInfo.connected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  networkInfo.connected ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {networkInfo.connected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-extrabold text-xs">
                  {networkInfo.connected ? 'Device is Online & Connected' : 'No Internet Connection'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Connection: <span className="font-mono font-bold uppercase">{networkInfo.connectionType}</span>
                </p>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                networkInfo.connected ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
              }`}
            >
              {networkInfo.connected ? 'ACTIVE' : 'OFFLINE'}
            </span>
          </div>

          {/* Backend Server URL Configuration */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">
              Backend API Server URL (Internet / Wi-Fi)
            </label>
            <div className="relative">
              <Server className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="http://192.168.1.100:5000/api or https://api.wepsun.com/api"
                value={apiUrlInput}
                onChange={(e) => setApiUrlInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Enter your live Cloud domain, computer's Wi-Fi IP address, or standard gateway.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 block">Quick Server Presets:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreset('https://wepsun.onrender.com/api')}
                className="p-2 text-left rounded-xl border border-slate-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cloud Production</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-700 block truncate">wepsun.onrender.com</span>
              </button>

              <button
                type="button"
                onClick={() => setPreset('http://localhost:5000/api')}
                className="p-2 text-left rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Laptop className="w-3.5 h-3.5 text-blue-600" />
                  <span>Localhost (PC)</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 block truncate">localhost:5000</span>
              </button>

              <button
                type="button"
                onClick={() => setPreset('http://10.0.2.2:5000/api')}
                className="p-2 text-left rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-purple-50/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  <span>Android Emulator</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 block truncate">10.0.2.2:5000</span>
              </button>

              <button
                type="button"
                onClick={() => setPreset('/api')}
                className="p-2 text-left rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reverse Proxy / Cloud</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 block truncate">/api</span>
              </button>
            </div>
          </div>

          {/* Test Connection Button & Live Result */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <Activity className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Pinging Server...' : '⚡ Ping & Test Server Connection'}</span>
            </button>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-[11px] animate-in fade-in duration-150 ${
                  testResult.connected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    {testResult.connected ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    {testResult.connected ? 'Server is Live' : 'Connection Failed'}
                  </span>
                  <span className="font-mono">{testResult.latencyMs}ms</span>
                </div>
                {testResult.error && <p className="mt-1 text-rose-700 font-medium">{testResult.error}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};
