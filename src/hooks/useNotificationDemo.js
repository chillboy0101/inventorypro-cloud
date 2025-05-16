import { useNotifications } from '../contexts/NotificationContext';
import { useSelector } from 'react-redux';
/**
 * Custom hook for demonstrating the notification system
 * Shows example notifications based on user settings
 */
export const useNotificationDemo = () => {
    const { addNotification } = useNotifications();
    const settings = useSelector((state) => state.settings);
    /**
     * Sends a demo notification of each type if notifications are enabled
     */
    const showNotificationDemos = () => {
        if (!settings.notifications) {
            // Only show this one even if notifications are disabled
            addNotification({
                type: 'warning',
                title: 'Notifications Disabled',
                message: 'Enable notifications in settings to see system alerts',
                autoClose: true,
                duration: 5000
            });
            return;
        }
        // Show welcome notification with email
        addNotification({
            type: 'info',
            title: 'Welcome to InventoryPro',
            message: 'Notification settings are now active',
            autoClose: true,
            duration: 5000,
            sendEmail: true,
            emailType: 'user_settings',
            emailDetails: {
                userName: settings.userName,
                darkMode: settings.darkMode,
                currency: settings.currency,
                notifications: settings.notifications
            }
        });
        setTimeout(() => {
            addNotification({
                type: 'success',
                title: 'Settings Saved',
                message: 'Your profile settings were saved successfully',
                autoClose: true,
                duration: 5000
            });
        }, 1500);
        setTimeout(() => {
            // Low stock notification with email
            addNotification({
                type: 'warning',
                title: 'Low Stock Alert',
                message: '5 products are below minimum stock level',
                autoClose: true,
                duration: 5000,
                sendEmail: true,
                emailType: 'low_stock',
                emailDetails: {
                    products: [
                        { name: 'Wireless Headphones', stock: 3, reorder_level: 5 },
                        { name: 'USB-C Cable', stock: 2, reorder_level: 10 },
                        { name: 'Power Bank 10000mAh', stock: 1, reorder_level: 5 },
                        { name: 'Bluetooth Speaker', stock: 4, reorder_level: 8 },
                        { name: 'Keyboard', stock: 2, reorder_level: 5 }
                    ]
                }
            });
        }, 3000);
        setTimeout(() => {
            // Order update notification with email
            addNotification({
                type: 'info',
                title: 'Order Status Updated',
                message: 'Order #ORD-2025-0123 has been shipped',
                autoClose: true,
                duration: 5000,
                sendEmail: true,
                emailType: 'order_update',
                emailDetails: {
                    orderId: 'ORD-2025-0123',
                    status: 'shipped',
                    customer: 'John Smith',
                    amount: 156.75,
                    currency: settings.currency || 'USD'
                }
            });
        }, 4500);
    };
    return { showNotificationDemos };
};
