export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Different News API",
    version: "1.0.0",
    description: "Different News 서비스의 API 명세입니다.",
  },
  tags: [
    { name: "Topics", description: "사용자 토픽 관련 API" },
    { name: "Admin", description: "관리자 콘솔용 API" },
    { name: "Scrape", description: "RSS 스크래핑 API" },
  ],
  paths: {
    "/api/topics": {
      get: {
        summary: "발행된 토픽 목록 조회",
        description: "사용자에게 노출되는 발행 상태의 토픽 목록을 최신순으로 반환합니다.",
        tags: ["Topics"],
        responses: {
          "200": {
            description: "성공적으로 토픽 목록을 반환했습니다.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      display_name: { type: "string", example: "미국 대선 주요 공약" },
                      summary: {
                        type: "string",
                        example: "민주·공화 양당의 경제 공약을 비교합니다.",
                      },
                      published_at: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/topics/{topicId}": {
      get: {
        summary: "특정 토픽 상세 조회",
        description: "선택한 토픽 정보와 좌·우 기사 목록을 함께 반환합니다.",
        tags: ["Topics"],
        parameters: [
          {
            name: "topicId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "조회할 토픽의 고유 ID",
          },
        ],
        responses: {
          "200": {
            description: "토픽 정보와 관련 기사 목록을 반환했습니다.",
          },
          "404": { description: "해당 토픽을 찾을 수 없습니다." },
        },
      },
    },
    "/api/topics/{topicId}/comments": {
      get: {
        summary: "토픽 댓글 목록 조회",
        description: "최근 작성된 순서대로 댓글 목록을 반환합니다.",
        tags: ["Topics"],
        parameters: [
          {
            name: "topicId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "댓글을 조회할 토픽의 고유 ID",
          },
        ],
        responses: {
          "200": { description: "댓글 목록을 반환했습니다." },
        },
      },
      post: {
        summary: "토픽 댓글 작성",
        description: "인증된 사용자가 새로운 댓글을 작성합니다.",
        tags: ["Topics"],
        parameters: [
          {
            name: "topicId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "댓글을 작성할 토픽의 고유 ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: { type: "string", example: "흥미로운 관점이네요!" },
                },
                required: ["content"],
              },
            },
          },
        },
        responses: {
          "201": { description: "댓글이 성공적으로 등록되었습니다." },
          "401": { description: "인증 토큰이 필요합니다." },
        },
      },
    },
    "/api/scrape": {
      get: {
        summary: "카테고리별 RSS 기사 제목 수집",
        description: "카테고리에 매핑된 모든 RSS 피드에서 기사 제목을 수집합니다.",
        tags: ["Scrape"],
        parameters: [
          {
            name: "category",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "수집할 카테고리 (예: 정치, 경제, 사회, 문화)",
          },
        ],
        responses: {
          "200": { description: "수집된 기사 제목 목록을 반환합니다." },
          "404": { description: "카테고리에 매핑된 RSS 피드가 없습니다." },
        },
      },
    },
    "/api/admin/health": {
      get: {
        summary: "관리자 API 상태 확인",
        description: "관리자 API 서버가 정상인지 확인합니다.",
        tags: ["Admin"],
        responses: {
          "200": { description: "서버가 정상 동작 중입니다." },
        },
      },
    },
    "/api/admin/login": {
      post: {
        summary: "관리자 로그인",
        description: "관리자 계정으로 JWT 토큰을 발급합니다.",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "비밀번호" },
                },
                required: ["username", "password"],
              },
            },
          },
        },
        responses: {
          "200": { description: "로그인 성공" },
          "401": { description: "인증 실패" },
        },
      },
    },
    "/api/admin/topics/suggested": {
      get: {
        summary: "제안된 토픽 목록 조회",
        description: "검토 대기 중인 제안 상태의 토픽을 조회합니다.",
        tags: ["Admin"],
        responses: {
          "200": { description: "제안된 토픽 목록을 반환합니다." },
        },
      },
    },
    "/api/admin/topics/published": {
      get: {
        summary: "발행된 토픽 목록 조회 (관리자)",
        description: "발행 완료된 토픽을 최신순으로 조회합니다.",
        tags: ["Admin"],
        responses: {
          "200": { description: "발행된 토픽 목록을 반환합니다." },
        },
      },
    },
    "/api/admin/topics": {
      post: {
        summary: "신규 토픽 생성",
        description: "관리자가 직접 토픽을 생성하고 즉시 발행합니다.",
        tags: ["Admin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  displayName: { type: "string", example: "AI 산업 규제" },
                  searchKeywords: { type: "string", example: "인공지능, 규제, 산업" },
                  summary: { type: "string", example: "주요 국가의 AI 산업 규제 논의를 정리합니다." },
                },
                required: ["displayName", "searchKeywords"],
              },
            },
          },
        },
        responses: {
          "201": { description: "토픽이 생성되고 기사 수집이 시작되었습니다." },
        },
      },
    },
    "/api/admin/topics/{topicId}/publish": {
      patch: {
        summary: "제안 토픽 발행",
        description: "제안된 토픽을 발행 상태로 변경하고 기사 수집을 시작합니다.",
        tags: ["Admin"],
        parameters: [
          {
            name: "topicId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "발행할 토픽 ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  displayName: { type: "string", example: "전기차 보조금 조정" },
                  searchKeywords: { type: "string", example: "전기차, 보조금, 정책" },
                  summary: { type: "string", example: "정부의 전기차 보조금 조정안 논의를 정리합니다." },
                },
                required: ["displayName", "searchKeywords"],
              },
            },
          },
        },
        responses: {
          "200": { description: "토픽이 발행되었습니다." },
          "404": { description: "토픽을 찾을 수 없거나 이미 처리되었습니다." },
        },
      },
    },
    "/api/admin/topics/{topicId}/reject": {
      patch: {
        summary: "제안 토픽 거절",
        description: "제안된 토픽을 거절 상태로 변경합니다.",
        tags: ["Admin"],
        parameters: [
          {
            name: "topicId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "거절할 토픽 ID",
          },
        ],
        responses: {
          "200": { description: "토픽이 거절되었습니다." },
          "404": { description: "토픽을 찾을 수 없거나 이미 처리되었습니다." },
        },
      },
    },
    "/api/admin/topics/{topicId}/recollect": {
      post: {
        summary: "발행 토픽 재수집",
        description: "발행된 토픽의 기사 수집을 다시 실행합니다.",
        tags: ["Admin"],
        parameters: [
          {
            name: "topicId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "재수집할 토픽 ID",
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  searchKeywords: { type: "string", example: "재조정된 검색 키워드" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "기사 재수집이 시작되었습니다." },
          "404": { description: "발행된 토픽을 찾을 수 없습니다." },
        },
      },
    },
    "/api/admin/articles/{articleId}/publish": {
      patch: {
        summary: "기사 발행",
        description: "기사 상태를 published로 변경합니다.",
        tags: ["Admin"],
        parameters: [
          {
            name: "articleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "발행할 기사 ID",
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  publishedAt: {
                    type: "string",
                    example: "2025-10-13 09:00",
                    description: "기사 발행 시각 (옵션)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "기사가 발행되었습니다." },
          "404": { description: "기사를 찾을 수 없습니다." },
        },
      },
    },
    "/api/admin/articles/{articleId}/unpublish": {
      patch: {
        summary: "기사 발행 취소",
        description: "기사 상태를 suggested로 되돌립니다.",
        tags: ["Admin"],
        parameters: [
          {
            name: "articleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "발행 취소할 기사 ID",
          },
        ],
        responses: {
          "200": { description: "기사 발행이 취소되었습니다." },
          "404": { description: "기사를 찾을 수 없거나 이미 취소되었습니다." },
        },
      },
    },
    "/api/admin/articles/{articleId}/feature": {
      patch: {
        summary: "기사 대표 설정",
        description: "토픽 내 대표 기사로 설정합니다.",
        tags: ["Admin"],
        parameters: [
          {
            name: "articleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "대표로 지정할 기사 ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  topicId: { type: "integer", example: 12 },
                  side: { type: "string", enum: ["LEFT", "RIGHT"], example: "LEFT" },
                },
                required: ["topicId", "side"],
              },
            },
          },
        },
        responses: {
          "200": { description: "대표 기사가 설정되었습니다." },
          "404": { description: "대상 기사 또는 토픽을 찾을 수 없습니다." },
        },
      },
    },
    "/api/admin/articles/{articleId}/delete": {
      patch: {
        summary: "기사 삭제",
        description: "기사 상태를 deleted로 변경합니다.",
        tags: ["Admin"],
        parameters: [
          {
            name: "articleId",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "삭제할 기사 ID",
          },
        ],
        responses: {
          "200": { description: "기사가 삭제되었습니다." },
          "404": { description: "기사를 찾을 수 없습니다." },
        },
      },
    },
  },
  servers: [
    { url: "/", description: "API 서버" },
  ],
} as const;
