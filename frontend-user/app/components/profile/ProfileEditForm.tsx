import { useState } from 'react';
import Image from 'next/image';
import { User } from '@/lib/types/user';
import FormField from '@/app/components/auth/FormField';
import { useSavedArticlesManager } from '@/hooks/useSavedArticles';
import { Bookmark, User as UserIcon, Phone, Edit3 } from 'lucide-react';
import TabButton from '../common/TabButton';
import { Button } from '../common/Button';

interface ProfileEditFormProps {
  profile: User;
  avatars: string[];
  selectedAvatar: string | undefined;
  isUpdating: boolean;
  error: string | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onUpdateProfile: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onSetSelectedAvatar: (avatarUrl: string) => void;
}

type InnerTab = 'info' | 'activity';

export default function ProfileEditForm({
  profile,
  avatars,
  selectedAvatar,
  isUpdating,
  error,
  onInputChange,
  onUpdateProfile,
  onCancelEdit,
  onSetSelectedAvatar,
}: ProfileEditFormProps) {
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [innerTab, setInnerTab] = useState<InnerTab>('info');
  const { articles: savedArticles } = useSavedArticlesManager();

  return (
    <div className="bg-card/50 border border-border rounded-2xl shadow-2xl p-6 md:p-8">
      {/* Centered Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-offset-4 ring-offset-zinc-900 ring-blue-500">
            <Image
              src={selectedAvatar || profile.profile_image_url || "/user-placeholder.svg"}
              alt="Current Avatar"
              layout="fill"
              objectFit="cover"
              className="rounded-full"
              unoptimized={true}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAvatarOptions(!showAvatarOptions)}
            className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-2.5 border-4 border-zinc-900 hover:bg-blue-700 transition-transform hover:scale-110"
            aria-label="Change Avatar"
          >
            <Edit3 size={18} />
          </button>
        </div>
        <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
        <p className="text-md text-muted-foreground">{profile.email}</p>
      </div>

      {/* Avatar Options Modal */}
      {showAvatarOptions && (
        <div className="mt-6 bg-card/50 p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">아바타 선택</h3>
          <div className="flex flex-wrap justify-center gap-5">
            {avatars.map((avatarUrl, index) => (
              <div
                key={index}
                className={`relative w-16 h-16 rounded-full cursor-pointer overflow-hidden transition-all duration-200 ease-in-out ${
                  selectedAvatar === avatarUrl ? 'ring-4 ring-red-500 scale-110' : 'ring-2 ring-zinc-600 hover:ring-blue-400'
                }`}
                onClick={() => { onSetSelectedAvatar(avatarUrl); setShowAvatarOptions(false); }}
              >
                <Image src={avatarUrl} alt={`Avatar ${index}`} layout="fill" objectFit="cover" className="rounded-full" unoptimized={true} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inner Tab Switcher */}
      <div className="flex justify-center my-8 p-1 bg-card rounded-full">
        <TabButton
          id="info"
          label="프로필 정보"
          activeId={innerTab}
          onClick={setInnerTab}
          baseClassName="px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300"
          activeClassName="bg-red-600 text-white"
          inactiveClassName="bg-card text-muted-foreground hover:bg-muted"
        />
        <TabButton
          id="activity"
          label="나의 활동"
          activeId={innerTab}
          onClick={setInnerTab}
          baseClassName="px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300"
          activeClassName="bg-red-600 text-white"
          inactiveClassName="bg-card text-muted-foreground hover:bg-muted"
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-[250px]">
        {innerTab === 'info' && (
          <form id="profile-form" onSubmit={onUpdateProfile} className="space-y-6 animate-fade-in-up">
            <FormField
              id="nickname"
              label="닉네임"
              type="text"
              name="nickname"
              value={profile.nickname || ""}
              onChange={onInputChange as React.ChangeEventHandler<HTMLInputElement>}
              icon={<UserIcon className="w-5 h-5 text-muted-foreground" />}
            />
            <FormField
              id="phone"
              label="전화번호"
              type="tel"
              name="phone"
              value={profile.phone || ""}
              onChange={onInputChange as React.ChangeEventHandler<HTMLInputElement>}
              icon={<Phone className="w-5 h-5 text-muted-foreground" />}
            />
            <div>
              <label htmlFor="introduction" className="block text-sm font-medium text-foreground mb-2">자기소개</label>
              <textarea
                id="introduction"
                name="introduction"
                value={profile.introduction || ""}
                onChange={onInputChange}
                rows={4}
                className="mt-1 block w-full bg-input border border-border rounded-md py-2 px-3 text-foreground shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="회원님의 관심사, 직업 등 자신을 소개해주세요."
              />
            </div>
          </form>
        )}

        {innerTab === 'activity' && (
          <div className="space-y-4 animate-fade-in-up">
             <div className="flex items-center justify-between p-4 bg-card/70 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <Bookmark className="w-6 h-6 text-blue-400" />
                <span className="font-semibold text-white text-lg">저장한 기사</span>
              </div>
              <span className="font-bold text-2xl text-blue-400">{savedArticles.length}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Global Action Buttons */}
      <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-zinc-700">
        <Button type="button" variant="secondary" onClick={onCancelEdit} className="px-6 py-3 text-sm font-semibold rounded-lg">
          취소
        </Button>
        <Button form="profile-form" type="submit" disabled={isUpdating} className="px-6 py-3 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
          {isUpdating ? "저장 중..." : "변경사항 저장"}
        </Button>
      </div>
       {error && (
        <div className="mt-4 text-red-400 text-sm text-center p-3 bg-red-900/50 rounded-md">{error}</div>
      )}
    </div>
  );
}