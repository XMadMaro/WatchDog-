import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ScandalStrategy } from '../types';
import { Icons } from './ui/Icons';

interface Props {
  strategy: ScandalStrategy;
  onReset: () => void;
}

export const ScandalResult: React.FC<Props> = ({ strategy, onReset }) => {
  const [activeTab, setActiveTab] = useState<'article' | 'email' | 'social'>('article');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
      
      {/* Header Section */}
      <div className="bg-red-600 p-1 rounded-t-xl">
        <div className="bg-slate-900 p-6 rounded-t-lg border-b border-red-600/30">
          <div className="flex items-center gap-2 text-red-500 mb-2 font-black uppercase tracking-widest text-xs">
            <Icons.Siren className="w-4 h-4 animate-pulse" />
            Alert Wysokiego Priorytetu
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase">
            {strategy.headline}
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900 border-b border-slate-700 flex">
        <button 
            onClick={() => setActiveTab('article')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'article' ? 'text-white border-b-2 border-red-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
        >
            <Icons.Alert className="w-4 h-4" /> Strategia Afery
        </button>
        <button 
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'email' ? 'text-white border-b-2 border-blue-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
        >
            <Icons.Mail className="w-4 h-4" /> Oficjalna Skarga
        </button>
        <button 
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'social' ? 'text-white border-b-2 border-green-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
        >
            <Icons.Share className="w-4 h-4" /> Social Media
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-slate-900 p-6 md:p-8 border-x border-b border-slate-700 rounded-b-xl shadow-2xl shadow-red-900/10 min-h-[400px]">
        
        {activeTab === 'article' && (
            <div className="animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-1 bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <span className="text-slate-500 text-xs font-mono uppercase">Cel Ataku</span>
                    <div className="text-xl font-bold text-red-400 mt-1">{strategy.targetAuthority}</div>
                </div>
                <div className="flex-1 bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <span className="text-slate-500 text-xs font-mono uppercase">Punkty Nacisku</span>
                    <ul className="mt-1 space-y-1">
                        {strategy.pressurePoints.map((point, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-yellow-500 font-medium">
                                <Icons.Trending className="w-3 h-3" /> {point}
                            </li>
                        ))}
                    </ul>
                </div>
                </div>

                <div className="prose prose-invert prose-red max-w-none mb-8">
                    <ReactMarkdown>{strategy.articleContent}</ReactMarkdown>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                    {strategy.hashtags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-600/30">
                            #{tag.replace('#', '')}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'email' && (
            <div className="animate-in fade-in duration-300 space-y-4">
                <div className="bg-slate-800 p-4 rounded border border-slate-700">
                    <div className="mb-2 text-xs uppercase text-slate-500 font-bold">Adresat</div>
                    <div className="text-white font-mono">{strategy.officialComplaint.recipient}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded border border-slate-700">
                    <div className="mb-2 text-xs uppercase text-slate-500 font-bold">Temat</div>
                    <div className="text-white font-bold">{strategy.officialComplaint.subject}</div>
                </div>
                <div className="bg-slate-100 text-slate-900 p-6 rounded border border-slate-300 font-serif whitespace-pre-line">
                    {strategy.officialComplaint.body}
                </div>
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <Icons.Mail className="w-4 h-4" /> Kopiuj Treść Skargi
                </button>
            </div>
        )}

        {activeTab === 'social' && (
            <div className="animate-in fade-in duration-300 grid gap-6">
                {/* Twitter / X */}
                <div className="bg-black/40 border border-slate-700 p-6 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                        <Icons.Twitter className="w-5 h-5" />
                        <span className="font-bold text-sm">Post na X (Twitter)</span>
                    </div>
                    <p className="text-white text-lg mb-4">{strategy.socialContent.twitterPost}</p>
                    <button className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-2">
                         <Icons.Send className="w-3 h-3" /> Opublikuj teraz
                    </button>
                </div>

                {/* Facebook */}
                <div className="bg-[#1877F2]/10 border border-[#1877F2]/30 p-6 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-[#1877F2]">
                        <Icons.Facebook className="w-5 h-5" />
                        <span className="font-bold text-sm">Post na Facebook</span>
                    </div>
                    <p className="text-slate-200 mb-4 whitespace-pre-line">{strategy.socialContent.facebookPost}</p>
                    <button className="text-xs font-bold text-[#1877F2] hover:text-blue-300 uppercase tracking-widest flex items-center gap-2">
                         <Icons.Send className="w-3 h-3" /> Opublikuj teraz
                    </button>
                </div>
            </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex gap-4 pt-6 border-t border-slate-800 mt-4">
          <button 
            onClick={onReset}
            className="px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Nowe Zgłoszenie
          </button>
        </div>

      </div>
    </div>
  );
};