'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProfileSidebar from '@/app/components/profile/ProfileSidebar';
import ProfileHeader from '@/app/components/profile/ProfileHeader';
import ProfileEditForm from '@/app/components/profile/ProfileEditForm';
import SavedArticles from '@/app/components/profile/SavedArticles';
import NotificationSettings from '@/app/components/profile/NotificationSettings';
import InquiryForm from '@/app/components/inquiry/InquiryForm';
import ChangePasswordForm from '@/app/components/profile/ChangePasswordForm';
import DeleteAccountSection from '@/app/components/profile/DeleteAccountSection';
import InquiryHistory from '@/app/components/profile/InquiryHistory';
import LoadingSpinner from '@/app/components/common/LoadingSpinner';

function ProfilePageContent() {
  const router = useRouter();
  const {
    profile,
    isEditing,
    isLoading,
    error,
    avatars,
    selectedAvatar,
    isUpdating,
    handleInputChange,
    handleUpdateProfile,
    setIsEditing,
    setSelectedAvatar,
  } = useUserProfile();

  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !profile) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center py-10 text-white">프로필 정보를 불러올 수 없습니다.</div>;
  }

  const handleInquirySuccess = () => {
    router.push('/profile?tab=inquiryHistory');
  };

  const renderContent = () => {
    if (isEditing && activeTab === 'profile') {
      return (
        <ProfileEditForm
          profile={profile}
          avatars={avatars}
          selectedAvatar={selectedAvatar}
          isUpdating={isUpdating}
          error={error}
          onInputChange={handleInputChange}
          onUpdateProfile={handleUpdateProfile}
          onCancelEdit={() => setIsEditing(false)}
          onSetSelectedAvatar={setSelectedAvatar}
        />
      );
    }

    switch (activeTab) {
      case 'profile':
        return <ProfileHeader profile={profile} onEditClick={() => setIsEditing(true)} />;
      case 'saved':
        return <SavedArticles />;
      case 'notifications':
        return <NotificationSettings />;
      case 'inquiry':
        return <InquiryForm onSuccess={handleInquirySuccess} />;
      case 'inquiryHistory':
        return <InquiryHistory />;
      case 'changePassword':
        return <ChangePasswordForm />;
      case 'deleteAccount':
        return <DeleteAccountSection />;
      default:
        return <div className="text-white">선택된 탭이 없습니다.</div>;
    }
  };

  return (
    <div className="flex-grow">
      <div className="bg-card rounded-xl border border-border shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-12">
        <aside className="md:w-64 flex-shrink-0">
          <Suspense fallback={<div className="w-full h-96 bg-muted rounded-lg animate-pulse" />}>
            <ProfileSidebar />
          </Suspense>
        </aside>
        <main className="flex-1 min-w-0">
          <Suspense fallback={<div className="w-full h-96 bg-muted rounded-lg animate-pulse" />}>
            <ProfilePageContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}