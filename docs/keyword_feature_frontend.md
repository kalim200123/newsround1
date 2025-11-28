# 이슈 NOW (트렌딩 키워드) 기능 - 프론트엔드 가이드

## 개요

홈 화면에 **"이슈 NOW"** 섹션을 통해 현재 가장 핫한 키워드 5개와 각 키워드별 관련 기사 3개를 보여주는 기능입니다.
기존의 키워드별 채팅방 기능은 제거되었습니다.

---

## API 엔드포인트

### 트렌딩 키워드 및 기사 조회

```typescript
GET / api / keywords / trending;
```

**응답 예시:**

```json
[
  {
    "keyword": "AI",
    "article_count": 125,
    "source_count": 15,
    "articles": [
      {
        "id": 101,
        "title": "[속보] AI 규제법 국회 통과",
        "url": "https://news.com/...",
        "source": "연합뉴스",
        "source_domain": "yna.co.kr",
        "favicon_url": "https://www.google.com/s2/favicons?domain=yna.co.kr&sz=32",
        "thumbnail_url": "https://img.yna.co.kr/...",
        "published_at": "2025-11-28T10:00:00Z"
      },
      // ... 기사 총 3개
    ]
  },
  {
    "keyword": "이재명",
    "article_count": 80,
    "source_count": 10,
    "articles": [...]
  }
  // ... 키워드 총 5개
]
```

---

## UI 구현 가이드

### 1. 홈 화면 섹션 ("이슈 NOW")

**레이아웃:**

- **상단**: "이슈 NOW" 타이틀 + 키워드 태그 목록 (가로 스크롤 또는 칩 형태)
- **하단**: 선택된 키워드의 관련 기사 3개 (카드 형태)

**동작:**

1. 페이지 로드 시 API 호출 (`/api/keywords/trending`)
2. 첫 번째 키워드를 기본 선택
3. 키워드 태그 클릭 시 해당 키워드의 기사 목록으로 전환 (애니메이션 권장)
4. 기사 클릭 시 해당 뉴스 원문 링크로 이동 (새 탭)

### 2. 컴포넌트 구조 예시

```tsx
const IssueNowSection = () => {
  const [data, setData] = useState([]);
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  useEffect(() => {
    // API 호출
    axios.get("/api/keywords/trending").then((res) => {
      setData(res.data);
      if (res.data.length > 0) setSelectedKeyword(res.data[0]);
    });
  }, []);

  if (!selectedKeyword) return null;

  return (
    <section>
      <h2>🔥 이슈 NOW</h2>

      {/* 키워드 탭 */}
      <div className="keyword-tabs">
        {data.map((item) => (
          <button
            key={item.keyword}
            className={selectedKeyword.keyword === item.keyword ? "active" : ""}
            onClick={() => setSelectedKeyword(item)}
          >
            #{item.keyword}
          </button>
        ))}
      </div>

      {/* 기사 목록 */}
      <div className="article-list">
        {selectedKeyword.articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
};
```

---

## 관리자 기능 (참고)

관리자는 `/admin/keywords` 페이지에서 트렌딩 키워드를 직접 관리합니다.

- 키워드 추가/삭제
- 키워드는 `tn_trending_keyword` 테이블에 저장됨
- API는 저장된 키워드를 기반으로 최근 3일 내의 기사를 검색하여 반환함

---

## 주의사항

1. **채팅 기능 없음**: 예전 기획과 달리 키워드별 채팅방은 없습니다.
2. **기사 데이터**: 기사는 `tn_home_article` 테이블에서 실시간으로 검색해옵니다.
3. **파비콘**: API 응답에 `favicon_url`이 포함되어 있으니 그대로 사용하면 됩니다.
