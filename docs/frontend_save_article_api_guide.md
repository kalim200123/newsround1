# 기사 저장/삭제 API 프론트엔드 가이드 (v3)

기존에 토픽에 포함된 기사(`tn_article`)만 저장 가능했던 기능이 모든 기사(`tn_home_article` 포함)를 저장할 수 있도록 확장되었습니다.

## 핵심 개념

### 저장 메커니즘

**모든 기사는 최종적으로 `tn_home_article` 테이블의 ID로 저장됩니다.**

- **`articleType: 'home'`**: `tn_home_article`의 기사 ID를 직접 사용
- **`articleType: 'topic'`**: `tn_article`의 ID를 받아서, 백엔드가 자동으로 해당 기사의 URL로 `tn_home_article`에서 매칭되는 ID를 찾아 저장

### 프론트엔드의 역할

프론트엔드는 기사 저장/삭제 요청 시 **해당 기사가 어느 테이블에서 왔는지**를 `articleType` 파라미터로 명시해야 합니다.

---

## API 엔드포인트

### 1. 기사 저장

**Endpoint:** `POST /api/articles/{articleId}/save`

#### 파라미터
- **`articleId` (Path)**: 저장하려는 기사의 ID
  - `articleType: 'home'`인 경우 → `tn_home_article`의 ID
  - `articleType: 'topic'`인 경우 → `tn_article`의 ID
  
- **Request Body**: 
  ```json
  {
    "articleType": "home" // 또는 "topic"
  }
  ```

#### 응답 예시

**성공 (201):**
```json
{
  "message": "Article saved successfully.",
  "data": {
    "savedArticleId": 123,
    "userId": 456,
    "articleId": 789  // tn_home_article의 ID
  }
}
```

**에러:**
- `400 Bad Request`: 잘못된 `articleType` 값
- `404 Not Found`: 기사를 찾을 수 없음
- `409 Conflict`: 이미 저장된 기사

#### 호출 예시

```typescript
// 홈 기사 저장 (tn_home_article)
const saveHomeArticle = async (articleId: number) => {
  try {
    const response = await apiClient.post(`/api/articles/${articleId}/save`, {
      articleType: 'home'
    });
    console.log('저장 완료:', response.data);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('이미 저장된 기사입니다.');
    }
  }
};

// 토픽 기사 저장 (tn_article)
const saveTopicArticle = async (articleId: number) => {
  try {
    const response = await apiClient.post(`/api/articles/${articleId}/save`, {
      articleType: 'topic'
    });
    console.log('저장 완료:', response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('tn_home_article에서 매칭되는 기사를 찾을 수 없습니다.');
    }
  }
};
```

---

### 2. 기사 저장 취소

**Endpoint:** `DELETE /api/articles/{articleId}/save`

#### 파라미터
- **`articleId` (Path)**: 저장 취소하려는 기사의 ID
  - `articleType: 'home'`인 경우 → `tn_home_article`의 ID
  - `articleType: 'topic'`인 경우 → `tn_article`의 ID
  
- **Query Parameter**: `articleType` (필수)

#### 호출 URL 예시
```
/api/articles/12345/save?articleType=home
/api/articles/67890/save?articleType=topic
```

#### 응답 예시

**성공 (200):**
```json
{
  "message": "Article unsaved successfully."
}
```

**에러:**
- `400 Bad Request`: `articleType`이 누락되거나 잘못된 값
- `404 Not Found`: 저장된 기사를 찾을 수 없음

#### 호출 예시

```typescript
// 홈 기사 저장 취소
const unsaveHomeArticle = async (articleId: number) => {
  try {
    const response = await apiClient.delete(
      `/api/articles/${articleId}/save?articleType=home`
    );
    console.log('저장 취소 완료');
  } catch (error) {
    console.error('저장 취소 실패:', error);
  }
};

// 토픽 기사 저장 취소
const unsaveTopicArticle = async (articleId: number) => {
  try {
    const response = await apiClient.delete(
      `/api/articles/${articleId}/save?articleType=topic`
    );
    console.log('저장 취소 완료');
  } catch (error) {
    console.error('저장 취소 실패:', error);
  }
};
```

---

## 프론트엔드 구현 가이드

### 1. 상태 관리

각 기사 객체에 `articleType`을 포함하여 관리합니다.

```typescript
interface Article {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  // ... 기타 필드
  articleType: 'home' | 'topic'; // 필수!
  isSaved?: boolean; // 저장 여부 (선택)
}
```

### 2. 백엔드 API 응답에 articleType 포함 요청

각 기사 목록 API에서 `articleType` 필드를 함께 반환하도록 백엔드에 요청하세요.

**예시:**
- `GET /api/articles/exclusives` → `articleType: 'home'` 추가
- `GET /api/articles/breaking` → `articleType: 'home'` 추가
- `GET /api/topics/{topicId}/articles` → `articleType: 'topic'` 추가

### 3. 컴포넌트 구현 예시

```typescript
import { useState } from 'react';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const [isSaved, setIsSaved] = useState(article.isSaved || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveToggle = async () => {
    setIsLoading(true);
    
    try {
      if (isSaved) {
        // 저장 취소
        await apiClient.delete(
          `/api/articles/${article.id}/save?articleType=${article.articleType}`
        );
        setIsSaved(false);
      } else {
        // 저장
        await apiClient.post(`/api/articles/${article.id}/save`, {
          articleType: article.articleType
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('저장/취소 실패:', error);
      // 에러 처리 (토스트 메시지 등)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="article-card">
      <h3>{article.title}</h3>
      <button 
        onClick={handleSaveToggle} 
        disabled={isLoading}
      >
        {isSaved ? '저장 취소' : '저장'}
      </button>
    </div>
  );
};
```

---

## 페이지별 articleType 값

| 페이지/컴포넌트 | articleType | 설명 |
|---|---|---|
| 홈 피드 | `'home'` | `tn_home_article`에서 가져온 기사 |
| 검색 결과 | `'home'` | AI 검색으로 찾은 `tn_home_article` 기사 |
| 카테고리 목록 | `'home'` | 카테고리별 `tn_home_article` 기사 |
| [단독] 목록 | `'home'` | 단독 기사도 `tn_home_article`에서 |
| [속보] 목록 | `'home'` | 속보 기사도 `tn_home_article`에서 |
| 토픽 상세 페이지 | `'topic'` | 해당 토픽의 `tn_article` 기사만 |

---

## 중요 참고사항

### 💡 저장 ID 통일
- 사용자가 토픽 기사(`tn_article` ID: 100)를 저장하더라도, 실제로는 해당 기사의 URL로 찾은 `tn_home_article`의 ID(예: 200)가 저장됩니다.
- 이는 데이터 중복을 방지하고, 저장 목록을 일관되게 관리하기 위함입니다.

### ⚠️ 에러 처리
- `articleType: 'topic'`으로 저장 시, 만약 `tn_home_article`에 매칭되는 기사가 없으면 `404 Not Found` 에러가 발생합니다.
- 이를 대비한 적절한 에러 메시지를 사용자에게 보여주세요.

### 🔄 저장 여부 확인
- 토픽 기사의 저장 여부를 확인할 때도, 최종적으로는 `tn_home_article`의 ID 기준으로 확인됩니다.
- 백엔드 API가 이를 자동으로 처리하므로, 프론트엔드는 받은 `articleType`과 `id`를 그대로 사용하면 됩니다.

---

## 테스트 시나리오

1. **홈 기사 저장**: 홈 피드에서 기사를 저장하고, 저장 목록에서 확인
2. **토픽 기사 저장**: 토픽 상세 페이지에서 기사를 저장하고, 저장 목록에서 확인
3. **중복 저장**: 이미 저장된 기사를 다시 저장 시도 → 409 에러 확인
4. **저장 취소**: 저장된 기사를 취소하고, 다시 저장 버튼 활성화 확인
5. **잘못된 articleType**: 의도적으로 잘못된 값 전송 → 400 에러 확인
