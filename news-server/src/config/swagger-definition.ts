export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Different News API",
    version: "1.0.0",
    description: "Different News 서비스의 API 명세입니다.",
  },
  tags: [
    { name: "Auth", description: "사용자 인증 API" },
    { name: "Topics", description: "사용자 토픽 관련 API" },
    { name: "Articles", description: "기사 관련 API" },
    { name: "Saved Articles", description: "저장된 기사 관련 API" },
    { name: "Admin", description: "관리자 콘솔용 API" },
    { name: "Jobs", description: "백그라운드 작업 API" },
  ],
  servers: [{ url: "/", description: "API 서버" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
} as const;
