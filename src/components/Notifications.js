import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNotifications } from '../contexts/NotificationContext';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
const Notifications = () => {
    const { notifications, removeNotification } = useNotifications();
    if (notifications.length === 0)
        return null;
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return _jsx(CheckCircleIcon, { className: "h-6 w-6 text-green-500" });
            case 'warning':
                return _jsx(ExclamationCircleIcon, { className: "h-6 w-6 text-yellow-500" });
            case 'error':
                return _jsx(XCircleIcon, { className: "h-6 w-6 text-red-500" });
            case 'info':
            default:
                return _jsx(InformationCircleIcon, { className: "h-6 w-6 text-blue-500" });
        }
    };
    const getNotificationColors = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
            case 'error':
                return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
            case 'info':
            default:
                return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
        }
    };
    return (_jsx("div", { className: "fixed top-4 right-4 z-50 w-80 space-y-3 pointer-events-none", children: notifications.map(notification => (_jsx("div", { className: `pointer-events-auto rounded-md border p-4 shadow-md transition-all duration-300 ease-in-out transform translate-x-0 ${getNotificationColors(notification.type)}`, children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: getNotificationIcon(notification.type) }), _jsxs("div", { className: "ml-3 flex-1", children: [notification.title && (_jsx("h3", { className: "text-sm font-medium dark:text-white", children: notification.title })), _jsx("div", { className: "text-sm dark:text-gray-200", children: notification.message })] }), _jsxs("button", { type: "button", className: "inline-flex rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none", onClick: () => removeNotification(notification.id), children: [_jsx("span", { className: "sr-only", children: "Close" }), _jsx(XMarkIcon, { className: "h-5 w-5", "aria-hidden": "true" })] })] }) }, notification.id))) }));
};
export default Notifications;
