import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  viewName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.viewName ?? 'Unknown'} crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="material-symbols-outlined text-4xl text-red-400">error_outline</span>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#131d20] dark:text-[#e2ecef]">Something went wrong</p>
            <p className="text-xs text-[#475053] dark:text-[#a8b8be] mt-1">{this.props.viewName && `in ${this.props.viewName} — `}{this.state.error?.message}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            type="button"
            className="px-4 py-1.5 bg-[#006481] text-white text-xs rounded-lg hover:bg-[#007ea2] transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

