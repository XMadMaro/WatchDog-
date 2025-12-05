import React from 'react';
import { SocialPost } from '../types';

interface Props {
  posts: SocialPost[];
}

export const SentimentChart: React.FC<Props> = ({ posts }) => {
  const total = posts.length;
  if (total === 0) return null;

  // Calculate counts
  const counts = posts.reduce((acc, post) => {
    acc[post.sentiment] = (acc[post.sentiment] || 0) + 1;
    return acc;
  }, { negative: 0, neutral: 0, positive: 0 } as Record<string, number>);

  const getPercent = (count: number) => total > 0 ? ((count / total) * 100) : 0;

  return (
    <div className="mb-6 p-4 bg-slate-900 rounded-lg border border-slate-700 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analiza Nastrojów</h4>
        <div className="text-[10px] bg-slate-800 text-slate-500 px-2 py-1 rounded-full font-mono">
          N={total}
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Negative Bar */}
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-red-400 font-semibold group-hover:text-red-300 transition-colors">Wściekłość (Negatywne)</span>
            <span className="text-slate-500 font-mono">{Math.round(getPercent(counts.negative))}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-sm h-2.5 overflow-hidden">
            <div 
              className="bg-red-600 h-full rounded-sm transition-all duration-1000 ease-out group-hover:bg-red-500 relative"
              style={{ width: `${getPercent(counts.negative)}%` }}
            >
              <div className="absolute inset-0 bg-white/10 w-full h-full opacity-0 group-hover:opacity-100"></div>
            </div>
          </div>
        </div>

        {/* Neutral Bar */}
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-semibold group-hover:text-slate-300 transition-colors">Obojętność (Neutralne)</span>
            <span className="text-slate-500 font-mono">{Math.round(getPercent(counts.neutral))}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-sm h-2.5 overflow-hidden">
            <div 
              className="bg-slate-500 h-full rounded-sm transition-all duration-1000 ease-out group-hover:bg-slate-400"
              style={{ width: `${getPercent(counts.neutral)}%` }}
            />
          </div>
        </div>

        {/* Positive Bar */}
        <div className="group">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-green-500 font-semibold group-hover:text-green-400 transition-colors">Sarkazm/Radość (Pozytywne)</span>
            <span className="text-slate-500 font-mono">{Math.round(getPercent(counts.positive))}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-sm h-2.5 overflow-hidden">
            <div 
              className="bg-green-600 h-full rounded-sm transition-all duration-1000 ease-out group-hover:bg-green-500"
              style={{ width: `${getPercent(counts.positive)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};