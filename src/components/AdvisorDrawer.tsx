import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  Clock,
  Calendar,
  Trash2,
  Loader2
} from 'lucide-react';
import type { AdvisorMessage, Game } from '../types/game';
import { askAdvisorWithGemini } from '../services/gemini';
import {
  loadStoredAdvisorMessages,
  saveStoredAdvisorMessages
} from '../utils/storage';

interface AdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  hoursPerDay: number;
  geminiApiKey: string;
  modelName: string;
}

export const AdvisorDrawer: React.FC<AdvisorDrawerProps> = ({
  isOpen,
  onClose,
  games,
  hoursPerDay,
  geminiApiKey,
  modelName,
}) => {
  const [messages, setMessages] = useState<AdvisorMessage[]>(() => loadStoredAdvisorMessages());
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute player queue context
  const activeGames = games.filter(g => g.status !== 'completed');
  const totalRemainingHours = activeGames.reduce((acc, g) => {
    const target = g.selectedHoursMode === 'mainStory' ? g.mainStoryHours : g.mainPlusExtrasHours;
    return acc + Math.max(0, target - g.playedHours);
  }, 0);

  const daysNeeded = hoursPerDay > 0 ? Math.ceil(totalRemainingHours / hoursPerDay) : 0;
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysNeeded);
  const formattedFinishDate = daysNeeded > 0
    ? finishDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Completed';

  // Save messages whenever they change
  useEffect(() => {
    saveStoredAdvisorMessages(messages);
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: AdvisorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    const { reply } = await askAdvisorWithGemini(
      query,
      messages,
      games,
      hoursPerDay,
      geminiApiKey,
      modelName
    );

    const assistantMsg: AdvisorMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: reply,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsLoading(false);
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem('playplan_advisor_v2');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Backlog & Deal Advisor
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-950 text-pink-300 border border-pink-800/60">
                  Gemini
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Context-aware purchase decisions & pacing advice
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Player Queue Context Strip */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backlog: <strong className="text-white">{totalRemainingHours}h</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Projected: <strong className="text-white">{formattedFinishDate}</strong></span>
          </div>
          <div className="text-[11px] text-slate-400">
            {hoursPerDay}h/day
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Should You Buy That Steam Sale Game?
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  Paste a Steam sale deal or game title. I will analyze whether you'll actually play it before the next major sale, given your {totalRemainingHours}h backlog!
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-1.5 pt-2 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                  Quick questions to ask:
                </p>
                {[
                  'Should I buy Cyberpunk 2077 for $29.99 on Steam sale?',
                  'Which game should I play first to avoid burnout?',
                  'Can I finish my active backlog in 2 months?',
                  'How do Days Gone and Red Dead Redemption 2 fit together?',
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800 text-xs text-slate-300 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0 border border-pink-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0 border border-pink-500/30">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 rounded-bl-none flex items-center gap-2">
                <span>Gemini is evaluating your queue & deal...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about your queue, deals, or should you buy X..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-pink-600/20 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-slate-500 text-center mt-2">
            Play Plan AI considers your {totalRemainingHours}h queue & {hoursPerDay}h daily pace.
          </div>
        </div>
      </div>
    </div>
  );
};
