import React from 'react';
import { X, Keyboard, Command, Sparkles, Box, Sliders, Play, Maximize2 } from 'lucide-react';

export default function KeyboardShortcutsDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  const SHORTCUT_GROUPS = [
    {
      title: '3D Ocean Slicer Controls',
      icon: Box,
      items: [
        { key: 'Left Click Drag', desc: 'Rotate 3D Ocean Slicer view freely in space' },
        { key: 'Right Click Drag', desc: 'Pan 3D camera across latitude & longitude' },
        { key: 'Scroll Wheel', desc: 'Zoom camera in & out' },
        { key: 'Click Float Marker', desc: 'Inspect vertical CTD profile & validation matchup' },
      ]
    },
    {
      title: 'Navigation & Modes',
      icon: Command,
      items: [
        { key: 'Ctrl + K / Cmd + K', desc: 'Open AAZHI Global Search UI' },
        { key: 'F / Esc', desc: 'Toggle Fullscreen Mode' },
        { key: '?', desc: 'Toggle Keyboard Shortcuts Drawer' },
        { key: 'Space', desc: 'Play / Pause monthly timeline playback' },
      ]
    },
    {
      title: 'Depth & Time Slicing',
      icon: Sliders,
      items: [
        { key: 'Vertical Slider', desc: 'Adjust sea level depth plane (0m to 2000m)' },
        { key: 'Month Scrubber', desc: 'Scrub through monthly model predictions' },
        { key: 'Year Buttons', desc: 'Switch reanalysis year (1980–2026)' },
        { key: 'Transect Slider', desc: 'Move vertical latitudinal curtain (-20°S to 25°N)' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in-up">
      <div className="w-full max-w-md h-full bg-[#04122d] border-l border-cyan-500/30 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto custom-scrollbar">
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/25 text-cyan-300">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-['Outfit']">Keyboard & Gesture Shortcuts</h2>
                <p className="text-xs text-slate-400 mt-0.5">Controls for AAZHI 3D Ocean Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-white/8 text-slate-400 hover:text-white hover:border-cyan-400/40 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Groups */}
          <div className="space-y-6">
            {SHORTCUT_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{group.title}</span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-[#020a18]/70 border border-white/5 gap-3">
                        <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-500/25 text-[11px] shrink-0">
                          {item.key}
                        </span>
                        <span className="text-[12px] text-slate-300 text-right leading-snug">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/8 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700">ESC</kbd> to close</span>
          <span className="text-cyan-400 font-bold">AAZHI v1.0.0</span>
        </div>

      </div>
    </div>
  );
}
