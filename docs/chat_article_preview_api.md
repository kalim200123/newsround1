# 채팅 기사 미리보기 기능 API 변경사항

> **작성일:** 2025-11-26  
> **대상:** 프론트엔드 개발자 (채팅 담당)  
> **변경 범위:** 채팅 API 응답 구조 변경

---

## 변경 개요

이제 채팅 메시지에 기사 URL이 포함되어 있으면, 백엔드에서 자동으로 기사 정보를 조회하여 `article_preview` 필드로 반환합니다.

## API 변경사항

### GET /api/topics/:topicId/chat

### POST /api/topics/:topicId/chat

두 엔드포인트 모두 응답에 `article_preview` 필드가 추가되었습니다.

### 기존 응답

```json
{
  "id": 1,
  "content": "이 기사 봤어? https://www.donga.com/news/Economy/article/all/20251125/132838158/1",
  "created_at": "2025-11-25T14:25:00Z",
  "nickname": "사용자1",
  "profile_image_url": "http://localhost:4001/public/avatars/default.svg"
}
```

### 변경 후 응답 (기사 URL이 있는 경우)

```json
{
  "id": 1,
  "content": "이 기사 봤어? https://www.donga.com/news/Economy/article/all/20251125/132838158/1",
  "created_at": "2025-11-25T14:25:00Z",
  "nickname": "사용자1",
  "profile_image_url": "http://localhost:4001/public/avatars/default.svg",
  "article_preview": {
    "id": 123,
    "title": "추태균, 퇴근기에 국회 방문... 에스토니안 의장대 사열",
    "source": "동아일보",
    "source_domain": "donga.com",
    "thumbnail_url": "https://dimg.donga.com/...",
    "published_at": "2025-11-24T10:00:00Z",
    "url": "https://www.donga.com/news/Economy/article/all/20251125/132838158/1"
  }
}
```

### 변경 후 응답 (기사 URL이 없는 경우)

```json
{
  "id": 2,
  "content": "안녕하세요!",
  "created_at": "2025-11-25T14:26:00Z",
  "nickname": "사용자2",
  "profile_image_url": "http://localhost:4001/public/avatars/avatar1.svg",
  "article_preview": null
}
```

## 프론트엔드 구현 가이드

### 1. 기사 카드 표시 여부 판단

```typescript
// 메시지에 article_preview가 있으면 카드로 표시
if (message.article_preview) {
  // ArticleCard 컴포넌트 사용
  return <ArticleCard article={message.article_preview} />;
} else {
  // 일반 텍스트 메시지
  return <div>{message.content}</div>;
}
```

### 2. ArticleCard 재사용

기존 `ArticleCard` 컴포넌트를 그대로 사용할 수 있습니다:

```tsx
import ArticleCard from "@/components/ArticleCard";

// article_preview 데이터를 ArticleCard에 전달
<ArticleCard article={message.article_preview} />;
```

### 3. 채팅 메시지 레이아웃 예시

```tsx
<div className="chat-message">
  <div className="message-header">
    <img src={message.profile_image_url} alt={message.nickname} />
    <span>{message.nickname}</span>
  </div>

  <div className="message-body">
    {message.article_preview ? (
      // 기사 카드 표시
      <ArticleCard article={message.article_preview} />
    ) : (
      // 일반 텍스트 표시
      <p>{message.content}</p>
    )}
  </div>
</div>
```

## 참고 사항

1. **URL 감지 로직**: 백엔드에서 `https://` 또는 `http://`로 시작하는 URL을 자동 감지합니다.
2. **DB 조회 우선순위**:
   - 먼저 `tn_article` 테이블에서 검색 (토픽 큐레이션 기사)
   - 없으면 `tn_home_article` 테이블에서 검색
   - 둘 다 없으면 `article_preview: null` 반환
3. **Socket.IO**: 실시간 채팅으로 받는 메시지에도 `article_preview`가 포함됩니다.
4. **성능**: 여러 메시지 조회 시 Promise.all로 병렬 처리되므로 성능 영향 최소화됩니다.

## 테스트 방법

1. 채팅창에 외부 기사 URL 붙여넣기:

   ```
   https://www.donga.com/news/Economy/article/all/20251125/132838158/1
   ```

2. 메시지 전송 후 받는 응답에서 `article_preview` 필드 확인

3. 기사 카드가 정상적으로 렌더링되는지 확인

---

**문의사항이 있으면 백엔드 담당자에게 연락 주세요!**
