import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                hasError: false
            }
        });
    }
    static getDerivedStateFromError(_) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Something went wrong" }), _jsx("p", { className: "text-gray-600 mb-4", children: "We're sorry, but there was an error loading this page." }), _jsx("button", { onClick: () => {
                                this.setState({ hasError: false });
                                window.location.reload();
                            }, className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700", children: "Reload Page" })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
