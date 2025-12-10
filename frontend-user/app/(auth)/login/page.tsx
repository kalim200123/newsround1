"use client";

// 'news' 프로젝트의 경로로 수정
import AuthLayout from "@/app/components/auth/AuthLayout";

// --- 아래 로직은 'news' 프로젝트에 맞게 수정이 필요합니다. ---
import { useAuth } from "@/app/context/AuthContext"; // 'news' 프로젝트에 AuthContext가 없다면 이 부분 수정 필요
import { loginUser } from "@/lib/api"; // 'news' 프로젝트의 lib/api.ts에 loginUser 함수 추가 필요
// --- ---

import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// 유효성 검사 규칙
const VALIDATION_RULES: Record<string, { validate: (value: string) => boolean; message: string }> = {
  email: {
    validate: (value) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value),
    message: "이메일 형식이 올바르지 않습니다.",
  },
  password: {
    validate: (value) => value.length > 0,
    message: "비밀번호를 입력해주세요.",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    // Clear the error for the field being typed in
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocusedField(e.target.name);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFocusedField(null); // Clear focused field on blur

    const rule = VALIDATION_RULES[name];
    if (rule) {
      const isValid = rule.validate(value);
      if (!isValid) {
        setErrors((prev) => ({ ...prev, [name]: rule.message }));
      } else {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Final validation on all fields
    const newErrors: Record<string, string> = {};
    let formIsValid = true;
    for (const key in formState) {
      const fieldName = key as keyof typeof formState;
      const rule = VALIDATION_RULES[fieldName];
      if (rule) {
        const isValid = rule.validate(formState[fieldName]);
        if (!isValid) {
          newErrors[fieldName] = rule.message;
          formIsValid = false;
        }
      }
    }
    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (!formIsValid) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginUser(formState);
      if (data.token && data.user) {
        login(data.token, data.user);
        router.push("/");
      } else {
        throw new Error("로그인에 성공했지만 필수 정보(토큰 또는 사용자 정보)를 받지 못했습니다.");
      }
    } catch (err: unknown) {
      let errorMessage = "알 수 없는 에러가 발생했습니다.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setServerError(errorMessage);
      console.error("Login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 'gloves' variant를 사용하여 애니메이션 적용
    <AuthLayout title="FIGHTER LOGIN" variant="gloves" focusedField={focusedField}>
      <form className="space-y-6 w-full" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <Mail
              className={`h-5 w-5 transition-colors duration-300 ${
                focusedField === "email" ? "text-red-500" : "text-neutral-500"
              }`}
            />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            value={formState.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            autoComplete="email"
            required
            placeholder="EMAIL ADDRESS"
            className={`
              w-full pl-12 pr-4 py-4 
              bg-neutral-800/50 
              border-2 ${errors.email && touched.email ? "border-red-500/50" : "border-neutral-700"} 
              rounded-xl 
              text-neutral-100 placeholder-neutral-500 font-medium
              focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:bg-neutral-800 
              transition-all duration-300 outline-none
            `}
          />
          {errors.email && (focusedField === "email" || (touched.email && formState.email.length > 0)) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-red-500 animate-fade-in">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          {errors.email && (focusedField === "email" || (touched.email && formState.email.length > 0)) && (
            <p className="absolute -bottom-5 left-2 text-red-400 text-[10px] font-bold tracking-wide">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <Lock
              className={`h-5 w-5 transition-colors duration-300 ${
                focusedField === "password" ? "text-red-500" : "text-neutral-500"
              }`}
            />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            value={formState.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            autoComplete="current-password"
            required
            placeholder="PASSWORD"
            className={`
              w-full pl-12 pr-4 py-4 
              bg-neutral-800/50 
              border-2 ${errors.password && touched.password ? "border-red-500/50" : "border-neutral-700"} 
              rounded-xl 
              text-neutral-100 placeholder-neutral-500 font-medium
              focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:bg-neutral-800 
              transition-all duration-300 outline-none
            `}
          />
          {errors.password && (focusedField === "password" || (touched.password && formState.password.length > 0)) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-red-500 animate-fade-in">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          {errors.password && (focusedField === "password" || (touched.password && formState.password.length > 0)) && (
            <p className="absolute -bottom-5 left-2 text-red-400 text-[10px] font-bold tracking-wide">
              {errors.password}
            </p>
          )}
        </div>

        {serverError && (
          <div className="text-red-200 text-sm text-center p-3 bg-red-900/40 border border-red-500/30 rounded-lg animate-shake">
            {serverError}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full py-4 
              bg-linear-to-r from-red-600 to-red-700 
              hover:from-red-500 hover:to-red-600 
              disabled:from-neutral-700 disabled:to-neutral-800 disabled:cursor-not-allowed disabled:text-neutral-500
              text-white font-black text-lg tracking-widest uppercase 
              rounded-xl shadow-[0_10px_20px_-5px_rgba(220,38,38,0.5)] 
              transform transition-all duration-200 
              hover:scale-[1.02] active:scale-[0.98] 
              flex items-center justify-center gap-3 group
              border-b-4 border-red-900 active:border-b-0 active:translate-y-1
            "
          >
            {isLoading ? (
              <span>LOADING...</span>
            ) : (
              <>
                <span>ENTER THE RING</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <div className="text-center text-sm text-neutral-500 font-medium">
          DON&apos;T HAVE AN ACCOUNT?{" "}
          <a href="/register" className="text-red-500 hover:text-red-400 hover:underline transition-colors ml-1">
            REGISTER NOW
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}
