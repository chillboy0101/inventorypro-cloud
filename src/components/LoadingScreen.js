import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const LoadingScreen = ({ message = 'Loading...' }) => {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center", children: [_jsx(motion.div, { className: "mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100", animate: {
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                    }, transition: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }, children: _jsx("svg", { className: "w-6 h-6 text-indigo-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) }) }), _jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: message }), _jsx("p", { className: "text-gray-600", children: "Please wait a moment..." })] }) }));
};
export default LoadingScreen;
