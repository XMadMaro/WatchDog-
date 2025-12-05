import React from 'react';
import { GroundingChunk } from '../types';
import { Icons } from './ui/Icons';

interface Props {
  text: string;
  chunks: GroundingChunk[];
}

export const GroundingView: React.FC<Props> = ({ text, chunks }) => {
  const mapChunks = chunks.filter(c => c.maps?.uri);

  return (
    <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
      <div className="flex items-center gap-2 mb-3 text-blue-400">
        <Icons.Map className="w-5 h-5" />
        <h3 className="font-semibold text-sm uppercase tracking-widest">Weryfikacja Lokalizacji (Google Maps)</h3>
      </div>
      
      <p className="text-slate-300 text-sm mb-4 leading-relaxed">{text}</p>

      {mapChunks.length > 0 && (
        <div className="grid gap-2">
          {mapChunks.map((chunk, idx) => (
            <a 
              key={idx} 
              href={chunk.maps?.uri} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors group"
            >
              <div className="mt-1 bg-blue-500/20 p-1.5 rounded text-blue-400">
                 <Icons.Map className="w-4 h-4" />
              </div>
              <div>
                <div className="text-blue-300 font-medium group-hover:underline">
                  {chunk.maps?.title || "Unknown Location"}
                </div>
                {chunk.maps?.placeAnswerSources?.reviewSnippets?.[0] && (
                   <p className="text-xs text-slate-500 italic mt-1">
                     "{chunk.maps.placeAnswerSources.reviewSnippets[0].snippet}"
                   </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
