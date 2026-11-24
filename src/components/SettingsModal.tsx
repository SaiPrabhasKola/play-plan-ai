import React, { useState } from 'react';
import {
  X,
  Key,
  Eye,
  EyeOff,
  Check,
  Cpu,
  Clock,
  RotateCcw,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import type { AppSettings } from '../types/game';
import { GoogleGenAI } from '@google/genai';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetToDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetToDefaults,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(settings.model);
  const [hoursPerDay, setHoursPerDay] = useState(settings.hoursPerDay);

  // Key testing state
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: 'Please enter a Google AI Studio API key first.',
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: keyToTest });
      const res = await ai.models.generateContent({
        model: model,
        contents: 'Ping test. Reply with word: OK',
      });

      if (res.text) {
        setTestResult({
          success: true,
          message: `Connected successfully to ${model}!`,
        });
      } else {
        throw new Error('No response text');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: `API check notice: ${msg}`,
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      geminiApiKey: apiKey.trim(),
      model,
      hoursPerDay: Math.max(0.5, Number(hoursPerDay) || 2),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Settings & API
              </h2>
              <p className="text-xs text-slate-400">
                Configure your Google AI Studio key & gaming pacing rate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          {/* RAWG Elimination Architecture Notice */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Zero-Key Architecture Active</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              RAWG has been completely eliminated. Live game search & deal pricing are handled by <strong>CheapShark API</strong> (zero-key, native CORS). The only key needed is your <strong>Google AI Studio (Gemini)</strong> key.
            </p>
          </div>

          {/* Google AI Studio API Key Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google AI Studio (Gemini) API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline"
              >
                Get Gemini API Key
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your Google AI Studio API key..."
                className="w-full px-4 py-2.5 pr-20 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 text-slate-400 hover:text-white"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Test Key Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTestingKey || !apiKey.trim()}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-all"
              >
                {isTestingKey ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              {testResult && (
                <span
                  className={`text-[11px] font-medium flex items-center gap-1 ${
                    testResult.success ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate max-w-xs">{testResult.message}</span>
                </span>
              )}
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini Model Architecture</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="gemini-4-hydrogen">gemini-4-hydrogen (Default / Recommended)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (High Performance)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Standard)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Powers Structured Outputs for game completion times, queue optimization, and Steam deal evaluation.
            </p>
          </div>

          {/* Daily Playtime Target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Daily Gaming Capacity:</span>
              </label>
              <span className="text-xs font-bold text-cyan-400">{hoursPerDay} hours / day</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-bold text-center"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Used to project exact completion calendar dates and pace queue orders.
            </p>
          </div>

          {/* Reset Queue Option */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-300">Default Backlog Games</div>
              <div className="text-[11px] text-slate-500">Restore the 6 pre-populated Steam titles</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset queue back to the 6 default backlog games?')) {
                  onResetToDefaults();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Backlog</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
