import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Different News API",
      version: "1.0.0",
      description: "Different News 서비스의 API 명세서입니다.",
    },
    // API 그룹(태그) 정의
    tags: [
      { name: "Topics", description: "사용자용 토픽 API" },
      { name: "Admin", description: "관리자용 API" },
    ],
    // API 경로 및 명세 직접 정의
    paths: {
      "/api/topics": {
        get: {
          summary: "발행된 토픽 목록 조회",
          description: "관리자가 발행(published)을 승인한 토픽들의 목록을 반환합니다.",
          tags: ["Topics"],
          responses: {
            "200": {
              description: "성공. 토픽 목록을 배열로 반환합니다.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        core_keyword: { type: "string", example: "대왕고래" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/admin/health": {
        get: {
          summary: "Admin API 상태 확인",
          description: "Admin API가 정상적으로 동작하는지 확인합니다.",
          tags: ["Admin"],
          responses: {
            "200": {
              description: "성공",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/admin/topics/suggested": {
        get: {
          summary: "'제안됨' 상태의 토픽 후보 목록 조회",
          description: "AI가 생성하고 관리자의 검토를 기다리는 토픽 후보 목록을 반환합니다.",
          tags: ["Admin"],
          responses: {
            "200": {
              description: "성공. 토픽 후보 목록을 배열로 반환합니다.",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 3 },
                        core_keyword: { type: "string", example: "민희진" },
                        status: { type: "string", example: "suggested" },
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "서버 오류",
            },
          },
        },
      },
      "/admin/topics/{topicId}/publish": {
        patch: {
          summary: "토픽을 '발행' 상태로 변경",
          description: "'suggested' 상태의 토픽을 'published' 상태로 변경하고, 최종 토픽명을 확정합니다.",
          tags: ["Admin"],
          parameters: [
            {
              name: "topicId",
              in: "path",
              required: true,
              schema: { type: "integer" },
            },
          ],
          // [추가] 요청 시 body에 어떤 데이터를 보내야 하는지 명시합니다.
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    displayName: {
                      type: "string",
                      example: "미국 비자 수수료 인상",
                    },
                    searchKeywords: {
                      type: "string",
                      example: "미국, 비자, H-1B, 수수료",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "성공적으로 발행됨" },
            "400": { description: "대표 토픽명이 누락됨" },
            "404": { description: "토픽을 찾을 수 없음" },
          },
        },
      },
      "/admin/topics/{topicId}/reject": {
        patch: {
          summary: "토픽을 '거절' 상태로 변경",
          description: "'suggested' 상태의 토픽을 'rejected' 상태로 변경합니다.",
          tags: ["Admin"],
          parameters: [
            {
              name: "topicId",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "거절할 토픽의 ID",
            },
          ],
          responses: {
            "200": { description: "성공적으로 거절됨" },
            "404": { description: "토픽을 찾을 수 없거나 이미 처리됨" },
            "500": { description: "서버 오류" },
          },
        },
      },
      "/admin/topics/{topicId}/articles": {
        get: {
          summary: "특정 토픽의 '제안된' 기사 후보 목록 조회",
          description: "관리자가 최종 검토할 기사 후보 목록을 반환합니다.",
          tags: ["Admin"],
          parameters: [
            {
              name: "topicId",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "기사 후보를 조회할 토픽의 ID",
            },
          ],
          responses: {
            "200": { description: "성공. 기사 후보 목록을 배열로 반환합니다." },
            "500": { description: "서버 오류" },
          },
        },
      },
      "/admin/articles/{articleId}/publish": {
        patch: {
          summary: "기사를 '발행' 상태로 변경",
          description: "관리자가 선택한 특정 기사를 'published' 상태로 변경합니다.",
          tags: ["Admin"],
          parameters: [
            {
              name: "articleId",
              in: "path",
              required: true,
              schema: { type: "integer" },
              description: "발행할 기사의 ID",
            },
          ],
          responses: {
            "200": { description: "성공적으로 발행됨" },
            "404": { description: "기사를 찾을 수 없음" },
            "500": { description: "서버 오류" },
          },
        },
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },
  // [중요] 이제 파일에서 주석을 읽어올 필요가 없으므로 빈 배열로 설정합니다.
  apis: [],
};

export const specs = swaggerJsdoc(options);
