// app/components/profile/ProfileInfoForm.tsx
'use client';

import { User } from '@/lib/types/user';
import FormField from '@/app/components/auth/FormField';
import { User as UserIcon, Phone } from 'lucide-react';

interface ProfileInfoFormProps {
  profile: User;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onUpdateProfile: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ProfileInfoForm({ profile, onInputChange, onUpdateProfile }: ProfileInfoFormProps) {
  return (
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
  );
}
