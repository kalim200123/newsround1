'use client';

import Image from 'next/image';
import { User } from '@/lib/types/user';
import { useSavedArticlesManager } from '@/hooks/useSavedArticles';
import { Bookmark } from 'lucide-react';

interface ProfileHeaderProps {
  profile: User;
  onEditClick: () => void;
}

export default function ProfileHeader({ profile, onEditClick }: ProfileHeaderProps) {
  const { articles: savedArticles } = useSavedArticlesManager();

  const activityStats = [
    {
      icon: <Bookmark className="w-7 h-7 text-blue-400" />,
      label: '저장한 기사',
      value: savedArticles.length,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Avatar */}
        <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden ring-4 ring-offset-4 ring-offset-card ring-blue-500 flex-shrink-0">
          <Image
            src={profile.profile_image_url || '/user-placeholder.svg'}
            alt="Current Avatar"
            fill
            className="object-cover"
            unoptimized={true}
          />
        </div>

        {/* Profile Info */}
        <div className="flex-grow text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{profile.name}</h2>
          <p className="text-md text-muted-foreground mt-1">{profile.email}</p>
          {profile.introduction && (
            <p className="text-base text-foreground/80 mt-4 max-w-xl mx-auto md:mx-0">
              {profile.introduction}
            </p>
          )}
        </div>

        {/* Edit Button */}
        <div className="flex-shrink-0">
          <button
            onClick={onEditClick}
            className="px-5 py-2.5 text-sm font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-colors duration-300 shadow-md"
          >
            프로필 수정
          </button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activityStats.map((stat, index) => (
          <div key={index} className="flex items-center p-5 bg-background rounded-xl border border-border">
            <div className="mr-5">{stat.icon}</div>
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
