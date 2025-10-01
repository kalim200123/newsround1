import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import { useAdminAuth } from "../../context/AdminAuthContext";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = (location.state as { from?: string } | null)?.from || "/admin";
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/admin/login", { username, password });
      const token = response.data?.token as string | undefined;
      if (!token) {
        throw new Error("토큰이 응답에 없습니다.");
      }
      login(token);
    } catch (error) {
      console.error(error);
      setErrorMessage("로그인에 실패했습니다. 아이디와 비밀번호를 확인하세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h1>관리자 로그인</h1>
        <label>
          아이디
          <input type="text" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {errorMessage && <p className="login-error-message">{errorMessage}</p>}
        <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;
