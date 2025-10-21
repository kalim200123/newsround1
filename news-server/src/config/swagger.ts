import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerDefinition } from "./swagger-definition";

// dist/config 폴더에서 ../../src/routes/ 경로를 찾도록 수정
const routesGlob = path.join(__dirname, "../../src/routes/**/*.ts");

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/**/*.ts"],
};

export const specs = swaggerJsdoc(options);