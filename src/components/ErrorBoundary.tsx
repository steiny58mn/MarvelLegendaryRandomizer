import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearDataAndReset = () => {
    try {
      localStorage.removeItem('legendary_settings');
      localStorage.removeItem('legendary_history');
      localStorage.removeItem('legendary_saved_setups');
      localStorage.removeItem('legendary_custom_presets');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900/90 border border-red-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <div className="p-3 bg-red-950/60 rounded-xl border border-red-800/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Something Went Wrong</h1>
                <p className="text-xs text-slate-400">An unexpected error occurred while rendering the application</p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs font-mono text-red-300 overflow-x-auto max-h-40">
                {this.state.error.message || 'Unknown error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleClearDataAndReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950/60 border border-slate-700 hover:border-red-800/60 text-slate-300 hover:text-red-300 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
                title="Clears cached settings and setups in localStorage and restarts"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
