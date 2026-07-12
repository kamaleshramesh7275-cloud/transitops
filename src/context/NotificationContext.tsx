import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type?: NotificationType) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Ask for Web Push Permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            setPushEnabled(true);
          }
        });
      }
    }
  }, []);

  const addNotification = (title: string, message: string, type: NotificationType = 'info') => {
    const newNotification: NotificationItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      read: false,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Trigger Web Push Notification if permitted and page is hidden, or always if preferred
    // For MVP, we trigger it if they granted permission.
    if (pushEnabled) {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.svg'
        });
      } catch (err) {
        console.error("Failed to send push notification:", err);
      }
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      unreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
