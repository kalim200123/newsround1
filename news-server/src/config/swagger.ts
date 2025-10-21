import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerDefinition } from "./swagger-definition";

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  // dist/config 폴더 기준, 상위로 두 번 올라가서 src/routes를 찾음
  apis: [path.join(__dirname, "../../src/routes/**/*.ts")],
};

export const specs = swaggerJsdoc(options);
