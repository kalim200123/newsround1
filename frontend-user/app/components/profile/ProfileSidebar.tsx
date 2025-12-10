'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Bookmark,
  Bell,
  MessageSquare,
  BookOpen,
  Lock,
  Trash2,
} from 'lucide-react';

const tabs = [
  { id: 'profile', label: '프로필', icon: User },
  { id: 'saved', label: '저장된 기사', icon: Bookmark },
  { id: 'notifications', label: '알림 설정', icon: Bell },
  { id: 'inquiry', label: '문의하기', icon: MessageSquare },
  { id: 'inquiryHistory', label: '문의 내역', icon: BookOpen },
  { id: 'changePassword', label: '비밀번호 변경', icon: Lock },
  { id: 'deleteAccount', label: '계정 삭제', icon: Trash2 },
];

export default function ProfileSidebar() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  return (
    <aside className="md:w-64 flex-shrink-0">
      <div className="sticky top-24">
        <h2 className="text-lg font-semibold text-foreground mb-6 px-3">마이페이지</h2>
        <nav className="flex flex-col space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/profile?tab=${tab.id}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
