# 🔔 프론트엔드 알림 시스템 구현 가이드

## 1. 개요

실시간 알림 시스템이 백엔드에 구현되었습니다. 프론트엔드에서는 **Socket.IO를 통한 실시간 수신**과 **REST API를 통한 목록 조회/관리**를 구현해야 합니다.

---

## 2. 알림 타입 (NotificationType)

| 타입             | 설명                  | 아이콘 (권장) |
| ---------------- | --------------------- | ------------- |
| `NEW_TOPIC`      | 새로운 투표 토픽 생성 | 🗳️ (투표함)   |
| `BREAKING_NEWS`  | [속보] 기사 감지      | 🚨 (사이렌)   |
| `EXCLUSIVE_NEWS` | [단독] 기사 감지      | ✨ (반짝임)   |
| `VOTE_REMINDER`  | 투표 마감 임박 (예정) | ⏰ (시계)     |
| `ADMIN_NOTICE`   | 관리자 공지           | 📢 (확성기)   |

---

## 3. 실시간 알림 (Socket.IO)

### 연결

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4001", {
  auth: { token: "USER_JWT_TOKEN" }, // 로그인한 경우 토큰 전달
});
```

### 이벤트 수신: `new_notification`

서버에서 알림이 발생하면 `new_notification` 이벤트가 전송됩니다.

**Payload 구조:**

```json
{
  "id": 123,
  "type": "BREAKING_NEWS",
  "message": "[속보] AI 규제법 국회 통과",
  "url": "https://news.com/article/123",
  "is_read": false,
  "created_at": "2025-11-28T10:00:00Z",
  "metadata": {
    "source": "연합뉴스",
    "source_domain": "yna.co.kr",
    "thumbnail_url": "https://img.yna.co.kr/...",
    "published_at": "2025-11-28T09:55:00Z"
  }
}
```

### 구현 요구사항

1. **헤더 배지 (Badge)**:

   - `new_notification` 이벤트 수신 시, 알림 아이콘에 **빨간 점(Red Dot)** 표시.
   - 읽지 않은 알림 개수(`unread_count`)를 증가시킴.

2. **토스트 팝업 (Toast)**:
   - 화면 우측 상단(또는 하단)에 잠시 나타났다 사라지는 팝업 표시.
   - **디자인**:
     - **속보/단독**: 썸네일 이미지 + 언론사 로고(파비콘) + 제목 (강조된 스타일)
     - **일반**: 아이콘 + 메시지
   - 클릭 시 해당 `url`로 이동하며 **읽음 처리** API 호출.

---

## 4. 알림 목록 페이지 (API)

### 4.1. 알림 목록 조회

- **API**: `GET /api/notifications`
- **응답**:

```json
[
  {
    "id": 123,
    "type": "BREAKING_NEWS",
    "message": "[속보] ...",
    "url": "...",
    "is_read": false,
    "created_at": "...",
    "metadata": { ... } // 속보/단독의 경우 이미지, 언론사 정보 포함
  },
  ...
]
```

- **UI 가이드**:
  - **속보/단독**: 카드 형태. 좌측에 썸네일, 상단에 언론사 파비콘+이름, 중앙에 제목.
  - **일반**: 리스트 형태. 아이콘 + 메시지.
  - **읽음 여부**: 읽지 않은 알림은 배경색을 약간 다르게(예: 연한 회색/파란색) 표시.

### 4.2. 읽음 처리

- **API**: `PATCH /api/notifications/:id/read`
- **시점**: 사용자가 알림을 클릭하거나, 목록에서 '모두 읽음' 버튼을 눌렀을 때.

### 4.3. 읽지 않은 개수 조회

- **API**: `GET /api/notifications/unread-count`
- **용도**: 페이지 새로고침 시 헤더 배지 초기값 설정.

---

## 5. 알림 설정 (마이페이지)

사용자가 원하는 알림만 받을 수 있도록 설정 페이지가 필요합니다.

### 5.1. 설정 조회

- **API**: `GET /api/users/me/notification-settings`
- **응답**:

```json
[
  { "notification_type": "NEW_TOPIC", "is_enabled": true },
  { "notification_type": "BREAKING_NEWS", "is_enabled": true },
  { "notification_type": "EXCLUSIVE_NEWS", "is_enabled": false }
]
```

### 5.2. 설정 변경

- **API**: `PUT /api/users/me/notification-settings`
- **요청**:

```json
{
  "notification_type": "EXCLUSIVE_NEWS",
  "is_enabled": true
}
```

- **UI**: 토글 스위치(On/Off) 목록으로 구현.

---

## 6. 파비콘(Favicon) 처리 팁

`metadata.source_domain`이 있는 경우(속보/단독), 구글 파비콘 서비스를 활용하면 간편합니다.

```html
<img src={`https://www.google.com/s2/favicons?domain=${source_domain}&sz=32`} />
```

---

## 7. 실시간 채팅 접속자 수 (User Count)

채팅방에 현재 접속 중인 사용자 수를 실시간으로 표시할 수 있습니다.

### 구현 방법

```javascript
useEffect(() => {
  // 1. 방 입장
  socket.emit("join_room", `topic_${topicId}`);

  // 2. 인원 수 수신 이벤트 리스너 등록
  socket.on("user_count", (count) => {
    console.log("현재 접속자 수:", count);
    setUserCount(count); // 상태 업데이트
  });

  return () => {
    // 3. 방 퇴장 (필수!)
    socket.emit("leave_room", `topic_${topicId}`);
    socket.off("user_count");
  };
}, [topicId]);
```

- **이벤트명**: `user_count`
- **데이터**: `number` (현재 접속자 수)
- **주의**: 컴포넌트가 언마운트되거나 방이 바뀔 때 반드시 `leave_room`을 호출해야 정확한 집계가 가능합니다.
