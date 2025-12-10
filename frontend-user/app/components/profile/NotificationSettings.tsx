import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { NotificationType } from '@/lib/types/shared';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const NOTIFICATION_DETAILS: Record<NotificationType, { name: string; description: string }> = {
  NEW_TOPIC: {
    name: "새 토픽 알림",
    description: "새로운 토론 주제가 생성되었을 때 알림을 받습니다.",
  },
  BREAKING_NEWS: {
    name: "속보 알림",
    description: "중요한 속보 뉴스가 발생했을 때 알림을 받습니다.",
  },
  EXCLUSIVE_NEWS: {
    name: "단독 뉴스 알림",
    description: "저희 플랫폼에서만 볼 수 있는 단독 뉴스가 발행될 때 알림을 받습니다.",
  },
  VOTE_REMINDER: {
    name: "투표 알림",
    description: "참여했던 토론의 투표 마감 시간이 다가올 때 알림을 받습니다.",
  },
  ADMIN_NOTICE: {
    name: "관리자 공지",
    description: "서비스 관련 중요 공지사항이 있을 때 알림을 받습니다.",
  },
  FRIEND_REQUEST: {
    name: "친구 요청",
    description: "다른 사용자로부터 친구 요청을 받았을 때 알림을 받습니다.",
  },
};

export default function NotificationSettings() {
  const { settings, isLoading, error, handleToggle } = useNotificationSettings();

  return (
    <section className="p-6 sm:p-8 bg-card rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-3">알림 설정</h2>

      {isLoading && (
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner size="large" />
        </div>
      )}

      {error && (
        <div className="my-4">
          <ErrorMessage message={error} />
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.notificationType}
              className="flex items-center justify-between p-4 bg-background rounded-md border border-border transition-colors duration-200 hover:border-primary/50"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground text-lg mb-1">
                  {(() => {
                    const name = NOTIFICATION_DETAILS[setting.notificationType].name;
                    const words = name.split(' ');
                    if (words[0] === '속보') {
                      return <><span className="text-red-500">{words[0]}</span> {words.slice(1).join(' ')}</>;
                    }
                    if (words[0] === '단독') {
                      return <><span className="text-blue-500">{words[0]}</span> {words.slice(1).join(' ')}</>;
                    }
                    return name;
                  })()}
                </span>
                <p className="text-muted-foreground text-sm">
                  {NOTIFICATION_DETAILS[setting.notificationType].description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={setting.isEnabled}
                  onChange={() => handleToggle(setting.notificationType)}
                />
                <div className="w-12 h-7 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary dark:bg-gray-700 dark:border-gray-600"></div>
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
