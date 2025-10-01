import axios from "axios";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

const signupPageStyles = `
  .auth-page-logo-container {
    position: absolute;
    top: 24px;
    left: 24px;
    z-index: 10;
  }

  .dark-signup-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    background: radial-gradient(circle at top, #1c2546 0%, #010104 55%);
    color: #f8f9ff;
  }

  .dark-signup-container {
    position: relative;
    width: 100%;
    max-width: 1120px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    background: rgba(10, 12, 20, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 36px 52px rgba(2, 6, 23, 0.5);
    backdrop-filter: blur(18px);
  }

  .dark-signup-info {
    padding: 64px 56px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    border-right: 1px solid rgba(148, 163, 184, 0.12);
    background: linear-gradient(155deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.7) 100%);
  }

  .dark-signup-kicker {
    font-size: 0.75rem;
    letter-spacing: 0.32em;
    color: #94a3b8;
    text-transform: uppercase;
  }

  .dark-signup-info h1 {
    margin: 0;
    font-size: 2.4rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .dark-signup-info p {
    margin: 0;
    color: #cbd5f5;
    line-height: 1.6;
  }

  .dark-signup-benefits {
    display: grid;
    gap: 16px;
  }

  .dark-signup-benefit {
    position: relative;
    padding: 16px 16px 16px 46px;
    background: rgba(15, 23, 42, 0.55);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 14px;
    color: #e2e8f0;
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .dark-signup-benefit::before {
    content: "";
    position: absolute;
    left: 18px;
    top: 24px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: linear-gradient(135deg, #22d3ee, #6366f1);
    box-shadow: 0 0 0 7px rgba(56, 189, 248, 0.25);
  }

  .dark-signup-form {
    padding: 64px 56px;
    display: flex;
    flex-direction: column;
    gap: 26px;
    background: rgba(6, 8, 15, 0.96);
  }

  .dark-signup-card-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dark-signup-card-title {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .dark-signup-card-subtitle {
    margin: 0;
    color: #9aa6c9;
    font-size: 0.95rem;
  }

  .dark-signup-form-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 18px;
  }

  .dark-signup-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dark-signup-field label {
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    font-weight: 600;
    color: #cbd5f5;
    text-transform: uppercase;
  }

  .dark-signup-input {
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 12px;
    padding: 14px 16px;
    color: #f8fafc;
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }

  .dark-signup-input::placeholder {
    color: rgba(148, 163, 184, 0.75);
  }

  .dark-signup-input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.22);
    transform: translateY(-1px);
  }

  .dark-signup-error {
    padding: 12px 16px;
    border-radius: 12px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.45);
    color: #fecaca;
    font-size: 0.9rem;
  }

  .dark-signup-button {
    margin-top: 6px;
    grid-column: 1 / -1;
    padding: 16px 18px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #22d3ee, #6366f1);
    color: #f1f5f9;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  }

  .dark-signup-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 22px rgba(79, 70, 229, 0.35);
    filter: brightness(1.03);
  }

  .dark-signup-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }

  .dark-signup-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .dark-signup-footer a {
    color: #7dd3fc;
    font-weight: 600;
  }

  .dark-signup-footer a:hover {
    color: #bae6fd;
  }

  @media (max-width: 960px) {
    .dark-signup-container {
      grid-template-columns: 1fr;
    }

    .dark-signup-info {
      border-right: none;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      text-align: center;
      align-items: center;
    }

    .dark-signup-form {
      padding: 48px 40px;
    }

    .dark-signup-form-fields {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .dark-signup-page {
      padding: 32px 12px;
    }

    .dark-signup-info {
      padding: 36px 24px;
    }

    .dark-signup-form {
      padding: 36px 24px;
    }

    .dark-signup-info h1 {
      font-size: 2rem;
    }

    .dark-signup-card-title {
      font-size: 1.75rem;
    }
  }
`;

const SignupPage: React.FC = () => {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const styles = useMemo(() => <style>{signupPageStyles}</style>, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedNickname = nickname.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedNickname || !trimmedEmail) {
      setError("필수 정보를 모두 입력해 주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const payload: Record<string, string> = {
        name: trimmedName,
        nickname: trimmedNickname,
        email: trimmedEmail,
        password,
      };

      if (trimmedPhone) {
        payload.phone = trimmedPhone;
      }

      const response = await axios.post("http://localhost:3000/user/signup", payload);

      if (response.status === 201) {
        toast.success("회원가입이 완료되었습니다. 2초 후 로그인 페이지로 이동합니다.");
        setTimeout(() => {
          navigate("/login");
        }, 2000); // 2초 지연
        return;
      }

      setError("회원가입을 완료할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || "회원가입 중 오류가 발생했습니다.");
      } else {
        setError("예상치 못한 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark-signup-page">
      {styles}
      <div className="dark-signup-container">
        <div className="auth-page-logo-container">
          <Link to="/" className="newsround-logo">
            NEWSROUND1
          </Link>
        </div>
        <section className="dark-signup-info">
          <span className="dark-signup-kicker">NEWSROUND1</span>
          <h1>뉴스 라운드를 시작해 보세요</h1>
          <p>회원가입을 완료하면 맞춤형 뉴스 큐레이션과 ROUND2 인사이트를 모두 즐길 수 있어요.</p>

          <div className="dark-signup-benefits">
            <div className="dark-signup-benefit">관심사에 맞춘 토픽 알림으로 더 빠르게 소식을 받아보세요.</div>
            <div className="dark-signup-benefit">닉네임으로 참여하는 커뮤니티 채팅에서 의견을 나눌 수 있어요.</div>
            <div className="dark-signup-benefit">내 활동 상태를 한눈에 관리할 수 있는 마이페이지 제공.</div>
          </div>
        </section>

        <section className="dark-signup-form">
          <header className="dark-signup-card-header">
            <h2 className="dark-signup-card-title">회원가입</h2>
            <p className="dark-signup-card-subtitle">필수 정보를 입력하고 NEWSROUND1의 다음 라운드에 참여해 보세요.</p>
          </header>

          {error && (
            <div className="dark-signup-error" role="alert">
              {error}
            </div>
          )}

          <form className="dark-signup-form-fields" onSubmit={handleSubmit}>
            <div className="dark-signup-field">
              <label htmlFor="name">이름</label>
              <input
                id="name"
                type="text"
                className="dark-signup-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="실명을 입력하세요"
                autoComplete="name"
                required
              />
            </div>

            <div className="dark-signup-field">
              <label htmlFor="nickname">닉네임</label>
              <input
                id="nickname"
                type="text"
                className="dark-signup-input"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="커뮤니티에서 사용할 이름"
                autoComplete="nickname"
                required
              />
            </div>

            <div className="dark-signup-field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                className="dark-signup-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="dark-signup-field">
              <label htmlFor="phone">휴대폰 번호</label>
              <input
                id="phone"
                type="tel"
                className="dark-signup-input"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="하이픈 없이 숫자만 입력"
                autoComplete="tel"
              />
            </div>

            <div className="dark-signup-field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                className="dark-signup-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="영문, 숫자를 조합해 입력"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="dark-signup-field">
              <label htmlFor="confirm-password">비밀번호 확인</label>
              <input
                id="confirm-password"
                type="password"
                className="dark-signup-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="비밀번호를 한 번 더 입력"
                autoComplete="new-password"
                required
              />
            </div>

            <button className="dark-signup-button" type="submit" disabled={isLoading}>
              {isLoading ? "가입 처리 중..." : "가입하기"}
            </button>
          </form>

          <footer className="dark-signup-footer">
            <span>
              이미 계정이 있으신가요? <Link to="/login">로그인</Link>
            </span>
            <span>문의가 필요하시면 NEWSROUND1 팀에 연락해 주세요.</span>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default SignupPage;
