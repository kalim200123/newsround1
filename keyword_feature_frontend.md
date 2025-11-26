# 키워드 채팅방 기능 - 프론트엔드 가이드

## 개요

키워드(예: `#탄핵`, `#이재명`)를 클릭하면 관련 기사와 실시간 채팅을 할 수 있는 페이지입니다.

---

## 새로운 API 엔드포인트

### 1. 전체 키워드 목록 조회

```typescript
GET / api / keywords;

응답: [
  {
    id: 540074,
    display_name: "탄핵",
    created_at: "2025-11-25T08:00:00Z",
  },
  {
    id: 540075,
    display_name: "이재명",
    created_at: "2025-11-25T09:00:00Z",
  },
];
```

### 2. 특정 키워드 조회

```typescript
GET /api/keywords/:keyword

예: GET /api/keywords/탄핵

응답:
{
  "id": 540074,
  "display_name": "탄핵",
  "created_at": "2025-11-25T08:00:00Z"
}

에러:
404 - "키워드를 찾을 수 없습니다."
```

---

## 페이지 구조

### URL

```
/keywords/:keyword
예: /keywords/탄핵
```

### 레이아웃

```
┌─────────────────────────────────────┐
│ #탄핵                      [7개 기사] │
├──────────────────────┬──────────────┤
│                      │              │
│   실시간 채팅         │  관련 기사    │
│   (40%)              │  (60%)       │
│                      │              │
└──────────────────────┴──────────────┘
```

---

## 데이터 플로우

### 페이지 로딩 시

```typescript
// 1. 키워드 정보 가져오기
const { data: topicData } = await axios.get(`/api/keywords/${keyword}`);
const topicId = topicData.id;

// 2. 관련 기사 검색 (기존 API 사용)
const { data: articles } = await axios.get(`/api/search`, {
  params: { q: keyword },
});

// 3. 채팅 내역 가져오기 (기존 API 사용)
const { data: chatMessages } = await axios.get(`/api/topics/${topicId}/chat`);
```

---

## 기존 API 재사용

### 기사 검색

```typescript
GET /api/search?q=탄핵
→ 최근 50개 기사 반환 (최신순)
```

### 채팅 조회

```typescript
GET /api/topics/{topicId}/chat
→ 기존 토픽 채팅 API 그대로 사용
```

### 채팅 작성

```typescript
POST /api/topics/{topicId}/chat
{
  "content": "안녕하세요"
}
→ 기존 토픽 채팅 API 그대로 사용
```

### Socket.IO

```typescript
// 키워드 채팅방 입장
socket.emit("join-topic-chat", { topicId });

// 실시간 메시지 수신 (기존과 동일)
socket.on("new-topic-chat-message", (message) => {
  // 채팅 UI 업데이트
});
```

---

## 구현 예시

### KeywordPage.tsx

```tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const KeywordPage = () => {
  const { keyword } = useParams();
  const [topicId, setTopicId] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 키워드 정보
        const { data: topic } = await axios.get(`/api/keywords/${keyword}`);
        setTopicId(topic.id);

        // 2. 관련 기사
        const { data: searchResults } = await axios.get("/api/search", {
          params: { q: keyword },
        });
        setArticles(searchResults);
      } catch (error) {
        console.error("Error loading keyword page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [keyword]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="keyword-page">
      <h1>#{keyword}</h1>
      <div className="content-layout">
        {/* 왼쪽: 채팅 */}
        <div className="chat-section">{topicId && <TopicChat topicId={topicId} />}</div>

        {/* 오른쪽: 기사 */}
        <div className="articles-section">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 주의사항

1. **채팅 컴포넌트 재사용**: 기존 토픽 채팅 컴포넌트를 그대로 사용하세요. `topicId`만 전달하면 됩니다.

2. **기사는 실시간 검색**: 기사는 DB에 저장되지 않고, 매번 검색 API로 가져옵니다.

3. **404 처리**: 존재하지 않는 키워드 접근 시 404 페이지로 리다이렉트하세요.

4. **URL 인코딩**: 키워드에 특수문자가 있을 수 있으니 `encodeURIComponent()` 사용하세요.

---

## 테스트

### DB 테스트 데이터 생성

```sql
-- 먼저 topic_type ENUM 변경 필요
ALTER TABLE tn_topic
MODIFY COLUMN topic_type ENUM('VOTING', 'CATEGORY', 'KEYWORD');

-- 테스트 키워드 생성
INSERT INTO tn_topic (display_name, topic_type, status, created_at)
VALUES ('탄핵', 'KEYWORD', 'OPEN', NOW());
```

### API 테스트

```bash
# 목록 조회
curl http://localhost:4001/api/keywords

# 특정 키워드 조회
curl http://localhost:4001/api/keywords/탄핵

# 관련 기사 검색
curl "http://localhost:4001/api/search?q=탄핵"
```
