
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../app/context/AuthContext';
import { getNotificationSettings, updateNotificationSettings } from '../lib/api';
import { NotificationSetting, NotificationType } from '../lib/types/shared';

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  "NEW_TOPIC",
  "BREAKING_NEWS",
  "EXCLUSIVE_NEWS",
  "VOTE_REMINDER",
  "ADMIN_NOTICE",
  "FRIEND_REQUEST", // New
];

export const useNotificationSettings = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedSettings = await getNotificationSettings(token);
        
        // Ensure fetchedSettings is an array and filter out any malformed entries
        const cleanFetchedSettings = (Array.isArray(fetchedSettings) ? fetchedSettings : []).filter(s => s && s.notificationType);

        // Merge fetched settings with default types to ensure all types are present and well-formed
        const mergedSettings = ALL_NOTIFICATION_TYPES.map(type => {
          const existingSetting = cleanFetchedSettings.find(s => s.notificationType === type);
          return {
            notificationType: type,
            isEnabled: existingSetting?.isEnabled ?? true, // Default to true if not set
          };
        });
        setSettings(mergedSettings);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("알림 설정을 불러오는데 실패했습니다.");
        }
        // If error, initialize with all types enabled by default
        setSettings(ALL_NOTIFICATION_TYPES.map(type => ({ notificationType: type, isEnabled: true })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  const handleToggle = useCallback(async (notificationType: NotificationType) => {
    if (!token) return;
    
    const originalSettings = [...settings];
    const newSettings = settings.map(setting => 
      setting.notificationType === notificationType
        ? { ...setting, isEnabled: !setting.isEnabled }
        : setting
    );
    
    // Optimistic update
    setSettings(newSettings);
    setError(null);

    try {
      await updateNotificationSettings(token, newSettings);
    } catch (err: unknown) {
      // Revert on error
      setSettings(originalSettings);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("알림 설정 업데이트에 실패했습니다.");
      }
    }
  }, [token, settings]);

  return {
    settings,
    isLoading,
    error,
    handleToggle,
  };
};
