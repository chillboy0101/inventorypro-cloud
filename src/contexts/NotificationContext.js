import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { sendEmail, generateEmailTemplate } from '../services/emailService';
const NotificationContext = createContext(undefined);
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const settings = useSelector((state) => state.settings);
    const { notifications: notificationsEnabled, userEmail } = settings;
    // Cleanup effect to remove expired notifications
    useEffect(() => {
        if (notifications.length === 0)
            return;
        const timers = notifications
            .filter(notification => notification.autoClose)
            .map(notification => {
            return setTimeout(() => {
                removeNotification(notification.id);
            }, notification.duration || 5000);
        });
        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [notifications]);
    const addNotification = async (notification) => {
        // Only add notification if enabled in user settings or it's a warning about notifications being disabled
        if (!notificationsEnabled && notification.type !== 'warning')
            return;
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(prev => [
            ...prev,
            {
                ...notification,
                id,
                autoClose: notification.autoClose !== false,
                duration: notification.duration || 5000,
            },
        ]);
        // Handle email notification if requested and enabled
        if (notification.sendEmail && notificationsEnabled && userEmail) {
            try {
                const emailType = notification.emailType || 'user_settings';
                const emailDetails = notification.emailDetails || {};
                const emailBody = generateEmailTemplate(emailType, {
                    ...emailDetails,
                    userName: settings.userName || 'User',
                    currency: settings.currency || 'USD',
                });
                await sendEmail({
                    to: userEmail,
                    subject: notification.title || 'Notification from InventoryPro',
                    body: emailBody,
                    isHtml: true
                });
                // Add a success notification that email was sent
                const emailId = Math.random().toString(36).substring(2, 9);
                setNotifications(prev => [
                    ...prev,
                    {
                        id: emailId,
                        type: 'success',
                        title: 'Email Sent',
                        message: `Notification email sent to ${userEmail}`,
                        autoClose: true,
                        duration: 3000,
                    },
                ]);
            }
            catch (error) {
                console.error('Failed to send email notification:', error);
            }
        }
    };
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };
    const clearNotifications = () => {
        setNotifications([]);
    };
    return (_jsx(NotificationContext.Provider, { value: {
            notifications,
            addNotification,
            removeNotification,
            clearNotifications,
        }, children: children }));
};
