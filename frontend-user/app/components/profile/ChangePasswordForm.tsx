"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { changePassword } from "@/lib/api/user"; // Will create this function
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import ErrorMessage from "@/app/components/common/ErrorMessage";

export default function ChangePasswordForm() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 6) { // Example minimum length
      setError("새 비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(token, currentPassword, newPassword);
      setSuccess("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
      alert("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
      logout();
      router.push("/login");
    } catch (err: unknown) {
      console.error("Password change error:", err);
      if (err instanceof Error) {
        if (String(err.message).includes("401") || String(err.message).includes("Unauthorized")) {
          alert("세션이 만료되었습니다. 다시 로그인해주세요.");
          logout();
          router.push("/login");
        } else {
          setError(err.message || "비밀번호 변경에 실패했습니다.");
        }
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">비밀번호 변경</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-muted-foreground">
            현재 비밀번호
          </label>
          <input
            type="password"
            id="currentPassword"
            className="mt-1 block w-full rounded-md border-border bg-input text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground">
            새 비밀번호
          </label>
          <input
            type="password"
            id="newPassword"
            className="mt-1 block w-full rounded-md border-border bg-input text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-muted-foreground">
            새 비밀번호 확인
          </label>
          <input
            type="password"
            id="confirmNewPassword"
            className="mt-1 block w-full rounded-md border-border bg-input text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </div>
        {error && <ErrorMessage message={error} />}
        {success && <p className="text-green-500 text-sm">{success}</p>}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size="small" /> : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
