import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation } from "react-router-dom";
import "../../App.css";
import { fetchPublishedTopics } from "../../api";
import { useUserAuth } from "../../context/UserAuthContext";
import type { Topic } from "../../types";

const NAV_ITEMS = [
  { label: "정치", to: "/politics" },
  { label: "경제", to: "/economy" },
  { label: "사회", to: "/society" },
  { label: "스포츠", to: "/sports" },
];

const HomePage = () => {
  const { user, logout } = useUserAuth();
  const location = useLocation();
  const toastShownRef = useRef(false);

  useEffect(() => {
    // StrictMode에서 이중 실행 방지를 위해 ref 사용
    if (location.state?.fromLogin && location.state?.userName && !toastShownRef.current) {
      toast.success(`환영합니다, ${location.state.userName}님!`);
      toastShownRef.current = true; // 토스트가 표시되었음을 기록
      // 새로고침 시 토스트가 다시 뜨는 것을 방지하기 위해 location.state를 초기화
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const isAuthenticated = Boolean(user);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadTopics = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await fetchPublishedTopics();
        setTopics(data ?? []);
      } catch (error) {
        console.error("토픽 조회 실패", error);
        setErrorMessage("토픽을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTopics();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("로그아웃 되었습니다.");
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const roundTwoTopics = useMemo(
    () =>
      topics
        .filter((topic) => Boolean(topic.display_name?.trim()))
        .map((topic) => ({ id: topic.id, name: topic.display_name!.trim() })),
    [topics]
  );

  return (
    <div className="newsround-page">
      <header className="newsround-header">
        <Link to="/" className="newsround-logo">NEWSROUND1</Link>
        <form className="newsround-search" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            placeholder="검색어를 입력하세요..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="newsround-search-input"
            aria-label="뉴스 검색"
          />
          <button type="submit" className="newsround-search-button">
            검색
          </button>
        </form>
        <div className="newsround-auth">
          {isAuthenticated ? (
            <div className="newsround-user-actions">
              <span className="newsround-welcome-text">{user?.name}님</span>
              <Link to="/mypage" className="newsround-auth-btn">
                마이페이지
              </Link>
              <button onClick={handleLogout} className="newsround-auth-btn primary">
                로그아웃
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="newsround-auth-btn">
                로그인
              </Link>
              <Link to="/signup" className="newsround-auth-btn primary">
                회원가입
              </Link>
            </>
          )}
        </div>
      </header>

      <nav className="newsround-nav">
        {NAV_ITEMS.map(({ label, to }) => (
          <Link key={label} to={to} className="newsround-nav-item">
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="newsround-content">
        <main className="newsround-main">
          {isLoading ? (
            <div className="newsround-status">콘텐츠를 불러오는 중입니다...</div>
          ) : errorMessage ? (
            <div className="newsround-status newsround-status--error">{errorMessage}</div>
          ) : (
            <section className="newsround-section">
              <div className="newsround-column">
                <h2 className="newsround-column-title">최신 뉴스</h2>
                <div className="newsround-column-divider" />
                <div className="newsround-placeholder">
                  <p>콘텐츠 준비 중입니다.</p>
                </div>
              </div>

              <div className="newsround-column newsround-column--chat">
                <h2 className="newsround-column-title">뉴스톡</h2>
                <div className="newsround-column-divider" />
                <div className="newsround-chat-card">
                  <div className="newsround-chat-status">방에 입장했습니다.</div>
                  <div className="newsround-chat-window" aria-label="채팅 미리보기" />
                  <form className="newsround-chat-form" onSubmit={handleChatSubmit}>
                    <input type="text" placeholder="메시지를 입력하세요..." className="newsround-chat-input" />
                    <button type="submit" className="newsround-chat-send">
                      전송
                    </button>
                  </form>
                </div>
              </div>

              <div className="newsround-column">
                <h2 className="newsround-column-title">인기 뉴스</h2>
                <div className="newsround-column-divider" />
                <div className="newsround-placeholder">
                  <p>콘텐츠 준비 중입니다.</p>
                </div>
              </div>
            </section>
          )}
        </main>

        <aside className="newsround-sidebar newsround-sidebar--right">
          <div className="newsround-round2">
            <h3 className="newsround-round2-title">ROUND2</h3>
            <div className="newsround-column-divider" />
            {roundTwoTopics.length > 0 ? (
              <ul className="newsround-round2-list">
                {roundTwoTopics.map((topic) => (
                  <li key={topic.id} className="newsround-round2-item">
                    <Link to={`/topics/${topic.id}`} className="newsround-round2-link">
                      {topic.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="newsround-round2-empty">현재 활성화된 토론방이 없습니다.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
