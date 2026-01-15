import { Component, ErrorInfo, ReactNode } from "react";

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
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white p-10 font-mono">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Application Crash</h1>
                    <div className="bg-gray-900 p-6 rounded-lg border border-red-900 overflow-auto">
                        <h2 className="text-xl font-bold mb-2">{this.state.error?.toString()}</h2>
                        <details className="whitespace-pre-wrap text-sm text-gray-400">
                            {this.state.errorInfo?.componentStack}
                        </details>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-bold"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
