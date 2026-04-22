/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Client, type IMessage, type IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './useAuth';

interface Notification {
  id: number;
  senderUsername: string;
  senderUserId?: number;
  senderProfilePictureUrl: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW';
  recipeId?: number;
  message: string;
  read: boolean;
  createdAt: string;
}

interface RecipeStats {
  likeCount: number;
  commentCount: number;
}

interface WebSocketContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  recipeStats: Record<number, RecipeStats>;
  viewerCounts: Record<number, number>;
  subscribeToRecipe: (id: number) => () => void;
  latestActivity: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [recipeStats, setRecipeStats] = useState<Record<number, RecipeStats>>({});
  const [viewerCounts, setViewerCounts] = useState<Record<number, number>>({});
  const [latestActivity, setLatestActivity] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (user?.roles?.includes('ROLE_ADMIN')) return;
    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const count = await response.json();
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  }, [user]);

  const fetchInitialNotifications = useCallback(async () => {
    if (user?.roles?.includes('ROLE_ADMIN')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications?page=0&size=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch initial notifications', error);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();
      fetchInitialNotifications();
      
      const socket = new SockJS('/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        debug: (str: string) => console.log(str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

        client.onConnect = () => {
        console.log('Connected to WebSocket');
        
        // 1. Personal Notifications
        if (!user.roles?.includes('ROLE_ADMIN')) {
          client.subscribe(`/user/${user.username}/queue/notifications`, (message: IMessage) => {
            const newNotification: Notification = JSON.parse(message.body);
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotification }));
          });
        }

        // 2. Global Activity
        client.subscribe('/topic/activity', (message: IMessage) => {
          const activity = JSON.parse(message.body);
          setLatestActivity(activity.message);
          // Hide after 5 seconds
          setTimeout(() => setLatestActivity((prev) => prev === activity.message ? null : prev), 5000);
        });
      };

      client.onStompError = (frame: IFrame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      };

      client.activate();
      setStompClient(client);

      return () => {
        if (client) {
          client.deactivate();
        }
      };
    }
  }, [isAuthenticated, user, fetchUnreadCount, fetchInitialNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const subscribeToRecipe = useCallback((id: number) => {
    if (!stompClient || !stompClient.connected) return () => {};

    // Subscribe to stats
    const statsSub = stompClient.subscribe(`/topic/recipes/${id}/stats`, (message: IMessage) => {
      const stats: RecipeStats & { recipeId: number } = JSON.parse(message.body);
      setRecipeStats((prev) => ({ ...prev, [id]: { likeCount: stats.likeCount, commentCount: stats.commentCount } }));
    });

    // Subscribe to viewers
    const viewerSub = stompClient.subscribe(`/topic/recipes/${id}/viewers`, (message: IMessage) => {
      const data = JSON.parse(message.body);
      setViewerCounts((prev) => ({ ...prev, [id]: data.count }));
    });

    return () => {
      statsSub.unsubscribe();
      viewerSub.unsubscribe();
    };
  }, [stompClient]);

  return (
    <WebSocketContext.Provider value={{ 
      notifications, unreadCount, markAsRead, markAllAsRead, 
      recipeStats, viewerCounts, subscribeToRecipe, latestActivity 
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
