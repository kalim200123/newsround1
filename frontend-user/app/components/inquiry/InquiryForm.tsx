"use client";

import { Button } from "@/app/components/common/Button";
import ErrorMessage from "@/app/components/common/ErrorMessage";
import { useAuth } from "@/app/context/AuthContext";
import { createInquiry } from "@/lib/api/inquiry";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, UploadCloud, X } from "lucide-react";
import React, { useState } from "react";

interface InquiryFormProps {
  onSuccess: () => void;
}

const InquiryForm: React.FC<InquiryFormProps> = ({ onSuccess }) => {
  const { token } = useAuth();

  // Form state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [privacyAgreement, setPrivacyAgreement] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // General state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false); // Local success state for animation

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError("첨부 파일은 5MB를 초과할 수 없습니다.");
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    const fileInput = document.getElementById("attachment") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!privacyAgreement) {
      setError("개인정보 수집 및 이용에 동의해야 합니다.");
      return;
    }
    if (!subject.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      if (!token) throw new Error("인증 토큰이 없습니다.");

      await createInquiry(token, subject, content, privacyAgreement, file);

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500); // Wait for success animation
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "문의 제출 중 오류가 발생했습니다.");
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">문의가 접수되었습니다</h2>
        <p className="text-muted-foreground">담당자가 확인 후 신속하게 답변 드리겠습니다.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="p-6 md:p-8 border-b border-border/50">
        <h2 className="text-2xl font-bold text-foreground">새 문의 작성</h2>
        <p className="text-muted-foreground text-sm mt-1">
          궁금한 점이나 불편한 사항을 남겨주시면 친절히 안내해 드립니다.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
          {/* Subject */}
          <div className="space-y-2">
            <label htmlFor="inquirySubject" className="text-sm font-semibold text-foreground flex items-center gap-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              id="inquirySubject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="제목을 입력해주세요"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              required
              disabled={isLoading}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="inquiryContent" className="text-sm font-semibold text-foreground flex items-center gap-2">
              문의 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="inquiryContent"
              rows={8}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none outline-none leading-relaxed"
              placeholder="문의하실 내용을 상세히 적어주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isLoading}
            ></textarea>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">첨부 파일 (선택)</label>

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  key="dropzone"
                >
                  <label
                    htmlFor="attachment"
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cn(
                      "relative cursor-pointer group flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border transition-all duration-200 hover:border-primary/50 hover:bg-accent/50",
                      isDragOver && "border-primary bg-primary/5 scale-[1.01]"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 bg-secondary rounded-full mb-3 group-hover:scale-110 transition-transform duration-200">
                        <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <p className="mb-1 text-sm text-foreground font-medium">
                        <span className="text-primary font-bold hover:underline">클릭하여 업로드</span> 또는 파일을
                        여기로 드래그
                      </p>
                      <p className="text-xs text-muted-foreground">최대 5MB (이미지, 문서 등)</p>
                    </div>
                    <input
                      id="attachment"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </label>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key="file-preview"
                  className="flex items-center justify-between w-full p-4 bg-secondary/30 border border-border rounded-xl"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate pr-4">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    type="button"
                    disabled={isLoading}
                    className="p-2 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Privacy Checkbox */}
          <div className="pt-4 border-t border-border/50">
            <label className="flex items-start gap-3 p-4 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors border border-transparent hover:border-border/50">
              <div className="relative flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  checked={privacyAgreement}
                  onChange={(e) => setPrivacyAgreement(e.target.checked)}
                  className="peer h-4 w-4 shrink-0 rounded-sm border-2 border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none checked:bg-primary checked:border-primary"
                  required
                />
                <CheckCircle2 className="pointer-events-none absolute h-3 w-3 top-0.5 left-0.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium leading-none">개인정보 수집 및 이용 동의</span>
                <p className="text-xs text-muted-foreground">
                  문의 처리를 위해 이메일, 이름, 문의 내용을 수집합니다. 수집된 정보는 문의 처리 목적으로만 이용되며,
                  관련 법령에 따라 일정 기간 보관될 수 있습니다.
                  <span className="text-primary hover:underline ml-1">자세히 보기</span>
                </p>
              </div>
            </label>
          </div>

          {/* Error & Actions */}
          <div className="space-y-4 pt-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <ErrorMessage message={error} />
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  제출 중...
                </>
              ) : (
                "문의 제출하기"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InquiryForm;
