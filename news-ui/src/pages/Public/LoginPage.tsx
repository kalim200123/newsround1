import axios from "axios";
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";

const loginPageStyles = `
  .auth-page-logo-container {
    position: absolute;
    top: 24px;
    left: 24px;
    z-index: 10;
  }

  .dark-login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    background: radial-gradient(circle at top, #2a2a72 0%, #000000 55%);
    color: #f8f9ff;
  }

  .dark-login-container {
    position: relative;
    width: 100%;
    max-width: 1040px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    background: rgba(8, 8, 12, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 32px 48px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(18px);
  }

  .dark-login-info {
    padding: 64px 56px;
    border-right: 1px solid rgba(148, 163, 184, 0.12);
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: linear-gradient(150deg, rgba(31, 41, 55, 0.9) 0%, rgba(15, 23, 42, 0.65) 100%);
  }

  .dark-login-kicker {
    font-size: 0.75rem;
    letter-spacing: 0.32em;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .dark-login-info h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .dark-login-info p {
    margin: 0;
    color: #cbd5f5;
    line-height: 1.6;
  }

  .dark-login-highlights {
    display: grid;
    gap: 14px;
  }

  .dark-login-highlight {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(15, 23, 42, 0.55);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 14px;
    padding: 14px 16px;
    color: #e2e8f0;
    font-size: 0.9rem;
  }

  .dark-login-highlight::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.25);
  }

  .dark-login-form {
    padding: 64px 56px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: rgba(10, 10, 15, 0.95);
  }

  .dark-login-card-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dark-login-card-title {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .dark-login-card-subtitle {
    margin: 0;
    color: #94a3b8;
    font-size: 0.95rem;
  }

  .dark-login-form-fields {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .dark-login-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dark-login-field label {
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    font-weight: 600;
    color: #cbd5f5;
    text-transform: uppercase;
  }

  .dark-login-input {
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 12px;
    padding: 14px 16px;
    color: #f8fafc;
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }

  .dark-login-input::placeholder {
    color: rgba(148, 163, 184, 0.75);
  }

  .dark-login-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.25);
    transform: translateY(-1px);
  }

  .dark-login-error {
    padding: 12px 16px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.45);
    color: #fecaca;
    font-size: 0.9rem;
  }

  .dark-login-button {
    margin-top: 8px;
    width: 100%;
    padding: 14px 16px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: #f1f5f9;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  }

  .dark-login-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(59, 130, 246, 0.35);
    filter: brightness(1.02);
  }

  .dark-login-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  .dark-login-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .dark-login-footer a {
    color: #60a5fa;
    font-weight: 600;
  }

  .dark-login-footer a:hover {
    color: #93c5fd;
  }

  .dark-login-metadata {
    font-size: 0.8rem;
    line-height: 1.4;
    color: #64748b;
  }

  @media (max-width: 900px) {
    .dark-login-container {
      grid-template-columns: 1fr;
    }

    .dark-login-info {
      padding: 48px 40px;
      border-right: none;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      text-align: center;
      align-items: center;
    }

    .dark-login-form {
      padding: 48px 40px;
    }

    .dark-login-highlights {
      max-width: 420px;
    }
  }

  @media (max-width: 600px) {
    .dark-login-page {
      padding: 32px 12px;
    }

    .dark-login-info {
      padding: 36px 24px;
    }

    .dark-login-form {
      padding: 36px 24px;
    }

    .dark-login-info h1 {
      font-size: 2rem;
    }

    .dark-login-card-title {
      font-size: 1.75rem;
    }
  }
`;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUserAuth();

  const styles = useMemo(() => <style>{loginPageStyles}</style>, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/user/login", {
        email,
        password,
      });

      if (response.status === 200 && response.data.token && response.data.user) {
        login(response.data.token, response.data.user);
        navigate("/", {
          state: {
            fromLogin: true,
            userName: response.data.user.name,
          },
        });
        return;
      }

      setError("로그인을 완료할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "로그인 중 오류가 발생했습니다.");
      } else {
        setError("예상치 못한 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark-login-page">
      {styles}
      <div className="dark-login-container">
        <div className="auth-page-logo-container">
          <Link to="/" className="newsround-logo">NEWSROUND1</Link>
        </div>
        <section className="dark-login-info">
          <span className="dark-login-kicker">NEWSROUND1</span>
          <h1>오신 것을 환영합니다</h1>
          <p>다음 라운드를 위한 큐레이션 뉴스를 계속 확인하려면 로그인하세요.</p>

          <div className="dark-login-highlights">
            <span className="dark-login-highlight">제휴 뉴스룸이 제공하는 맞춤형 토픽.</span>
            <span className="dark-login-highlight">하루 종일 업데이트되는 라운드 2 인사이트.</span>
            <span className="dark-login-highlight">커뮤니티 채팅으로 의견을 나눌 수 있어요.</span>
          </div>
        </section>

        <section className="dark-login-form">
          <header className="dark-login-card-header">
            <h2 className="dark-login-card-title">로그인</h2>
            <p className="dark-login-card-subtitle">대시보드에 접속하려면 아래 정보를 입력하세요.</p>
          </header>

          {error && (
            <div className="dark-login-error" role="alert">
              {error}
            </div>
          )}

          <form className="dark-login-form-fields" onSubmit={handleSubmit}>
            <div className="dark-login-field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                className="dark-login-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="이메일 주소를 입력하세요"
                autoComplete="email"
                required
              />
            </div>

            <div className="dark-login-field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                className="dark-login-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                required
              />
            </div>

            <button className="dark-login-button" type="submit" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <footer className="dark-login-footer">
            <span>
              처음이신가요? <Link to="/signup">회원가입</Link>
            </span>
            <span className="dark-login-metadata">도움이 필요하신가요? NEWSROUND1 팀에 문의해 주세요.</span>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
