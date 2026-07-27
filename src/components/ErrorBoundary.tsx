import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-red-900/90 z-[9999] p-8 flex flex-col items-center justify-center text-white overflow-y-auto">
          <div className="bg-white text-red-900 p-8 rounded-2xl max-w-4xl w-full shadow-2xl">
            <h1 className="text-3xl font-black mb-4">React App Crashed</h1>
            <h2 className="text-xl font-bold mb-4">{this.state.error && this.state.error.toString()}</h2>
            <details className="whitespace-pre-wrap font-mono text-xs bg-gray-100 p-4 rounded-xl border border-red-200">
              <summary className="font-bold cursor-pointer text-red-700">View Stack Trace</summary>
              <br />
              {this.state.errorInfo?.componentStack}
              <hr className="my-4 border-red-200" />
              {this.state.error?.stack}
            </details>
            <button 
              className="mt-6 bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
