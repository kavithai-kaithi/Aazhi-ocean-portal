import React, { useState } from 'react';
import { Play, Pause, ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2, Tv } from 'lucide-react';

const DEMO_STEPS = [
  { step: 1, id: 'overview', title: '01 Overview', tab: 'home', desc: 'Welcome to AAZHI 3D Ocean Observation Portal. Integrated models & in-situ Argo network.' },
  { step: 2, id: 'temp-slicer', title: '02 Temperature Slicer', tab: 'viewer', var: 'temperature', depth: 0, desc: '3D Sea-Surface Temperature view over Indian Ocean at 0m depth level.' },
  { step: 3, id: 'currents-3d', title: '03 Ocean Current Vectors', tab: 'viewer', var: 'currents', depth: 100, desc: '3D current flow velocity vectors (uo, vo) rendering monsoonal dynamics at 100m.' },
  { step: 4, id: 'salinity-strata', title: '04 Salinity & Depth Slicing', tab: 'viewer', var: 'salinity', depth: 500, desc: 'Deep salinity stratification profile down to 500m sea level.' },
  { step: 5, id: 'validation-skill', title: '05 Validation & Skill', tab: 'validation', var: 'temperature', desc: 'Quantitative model vs Argo float scatter comparison & Taylor skill diagram.' },
  { step: 6, id: 'station-matchup', title: '06 CTD Profile Matchup', tab: 'viewer', station: 'CTD-039', desc: 'Live CTD profile matchup with Mean Bias (-0.243°C) and Pearson R (1.000).' },
];

export default function DemoModeOverlay({ isActive, onClose, onNavigateStep }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!isActive) return null;

  const currentStep = DEMO_STEPS[currentIdx];

  const handleNext = () => {
    const nextIdx = (currentIdx + 1) % DEMO_STEPS.length;
    setCurrentIdx(nextIdx);
    const target = DEMO_STEPS[nextIdx];
    if (onNavigateStep) onNavigateStep(target);
  };

  const handlePrev = () => {
    const prevIdx = (currentIdx - 1 + DEMO_STEPS.length) % DEMO_STEPS.length;
    setCurrentIdx(prevIdx);
    const target = DEMO_STEPS[prevIdx];
    if (onNavigateStep) onNavigateStep(target);
  };

  const handleJump = (idx) => {
    setCurrentIdx(idx);
    const target = DEMO_STEPS[idx];
    if (onNavigateStep) onNavigateStep(target);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-fade-in-up">
      <div className="rounded-2xl bg-[#04122d]/95 border border-cyan-400/40 p-4 sm:p-5 shadow-[0_12px_48px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col gap-3">
        
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1.5 text-xs font-mono font-bold">
              <Tv className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>DEMO & PRESENTATION MODE</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Step {currentStep.step} of {DEMO_STEPS.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">{currentStep.title}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              {currentStep.desc}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-950/60 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:brightness-110 transition cursor-pointer"
            >
              <span>Next Demo Slide</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => handleJump(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIdx
                  ? 'w-8 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={s.title}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
