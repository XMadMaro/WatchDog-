import React from 'react';
import { Icons } from './ui/Icons';

interface Props {
  status: 'pending' | 'active' | 'completed';
  label: string;
  icon: React.ElementType;
}

export const ProcessingStep: React.FC<Props> = ({ status, label, icon: Icon }) => {
  const baseClasses = "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300";
  const activeClasses = "border-yellow-500 bg-yellow-500/10 text-yellow-400 animate-pulse";
  const completedClasses = "border-green-500 bg-green-500/10 text-green-400";
  const pendingClasses = "border-slate-700 bg-slate-800 text-slate-500";

  let className = baseClasses;
  if (status === 'active') className += ` ${activeClasses}`;
  else if (status === 'completed') className += ` ${completedClasses}`;
  else className += ` ${pendingClasses}`;

  return (
    <div className={className}>
      <Icon className={`w-5 h-5 ${status === 'active' ? 'animate-spin' : ''}`} />
      <span className="font-mono text-sm uppercase tracking-wider">{label}</span>
      {status === 'completed' && <Icons.ArrowRight className="w-4 h-4 ml-auto" />}
    </div>
  );
};
