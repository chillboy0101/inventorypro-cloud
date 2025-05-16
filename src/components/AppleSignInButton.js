import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { signInWithApple } from '../services/authService';
import { motion } from 'framer-motion';
const buttonVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: {
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeInOut" }
    },
    tap: {
        scale: 0.98,
        transition: { duration: 0.1, ease: "easeInOut" }
    }
};
const AppleSignInButton = () => {
    const handleAppleSignIn = async () => {
        try {
            await signInWithApple();
        }
        catch (error) {
            console.error('Apple sign in failed:', error);
        }
    };
    return (_jsxs(motion.button, { onClick: handleAppleSignIn, className: "w-full flex items-center justify-center h-[50px] border-0 rounded-md shadow-sm text-[14px] font-medium text-white bg-black hover:bg-[#1d1d1d] active:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-300", style: { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }, variants: buttonVariants, initial: "initial", animate: "animate", whileHover: "hover", whileTap: "tap", children: [_jsx(motion.svg, { className: "h-[18px] w-[18px] mr-3", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", initial: { scale: 1 }, whileHover: { scale: 1.1 }, transition: { duration: 0.2 }, children: _jsx("path", { d: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" }) }), "Sign in with Apple"] }));
};
export default AppleSignInButton;
