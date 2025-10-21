import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerDefinition } from "./config/swagger-definition"; // 경로 수정

console.log('--- Starting Swagger JSDoc diagnosis ---');

// 스크립트가 src 폴더 안에 있으므로, 경로를 수정합니다.
const routesGlob = path.join(__dirname, './routes/**/*.ts');

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [routesGlob],
};

try {
  console.log('Attempting to generate Swagger specs...');
  console.log(`Scanning files from glob: ${routesGlob}`);
  
  const specs = swaggerJsdoc(options);
  
  console.log('--- ✅  Swagger JSDoc generation SUCCEEDED! ---');
  console.log('The problem is likely not a YAML syntax error. Please check other configurations.');

} catch (error) {
  console.error('--- ❌ Swagger JSDoc generation FAILED! ---');
  console.error('This is the hidden error that is crashing the server:');
  console.error(error);
}
