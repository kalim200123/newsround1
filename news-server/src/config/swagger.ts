import swaggerJsdoc from "swagger-jsdoc";
import { swaggerDefinition } from "./swagger-definition";

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/**/*.ts"],
};

export const specs = swaggerJsdoc(options);
