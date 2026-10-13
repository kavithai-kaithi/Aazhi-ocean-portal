import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AAZHI Global Error Boundary caught]:', error, errorInfo);
  }

  handleReset = () => {
    window.location.href = window.location.origin;
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#010814] text-slate-100 p-6 selection:bg-cyan-500/30">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-[#04122d]/90 border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center space-y-6 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(6,182,212,0.4)] text-2xl font-bold">
              🌊
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
                AAZHI Ocean Portal
              </h1>
              <p className="text-xs text-cyan-300/80 font-mono font-semibold uppercase tracking-wider">
                Application Recovery Shield
              </p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              The application encountered a temporary display issue. You can reload the page or return to the overview dashboard.
            </p>

            {this.state.error?.message && (
              <div className="p-3.5 rounded-xl bg-black/50 border border-rose-500/20 text-rose-300 text-xs font-mono text-left overflow-x-auto max-h-32">
                <code>{this.state.error.message}</code>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs hover:bg-cyan-300 transition cursor-pointer shadow-lg font-mono"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 font-bold text-xs hover:bg-slate-800 transition cursor-pointer font-mono"
              >
                Reset to Overview
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
