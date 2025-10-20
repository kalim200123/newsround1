import swaggerJsdoc from "swagger-jsdoc";
import { swaggerDefinition } from "./swagger-definition";

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/jobs.ts", "./src/routes/admin.ts"],
};

export const specs = swaggerJsdoc(options);
