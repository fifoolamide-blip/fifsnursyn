import React from 'react';

const Watermark: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 select-none pointer-events-none z-[100] animate-in fade-in duration-1000">
      <div className="flex flex-col items-center bg-white/80 backdrop-blur-sm border border-slate-200 px-3 py-2 rounded-xl shadow-lg">
        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-0.5 leading-none">
          CREATED BY
        </span>
        <span className="text-sm font-black tracking-[0.2em] text-slate-900 uppercase leading-none">
          PHYPHOR
        </span>
      </div>
    </div>
  );
};

export default Watermark;