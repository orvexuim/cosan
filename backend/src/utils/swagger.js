import swaggerJSDoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'COSMAN API - Luxury Footwear Moroccan Brand',
      version: '1.0.0',
      description: 'Core infrastructure API documentation for COSMAN Luxury Moroccan footwear platform, supporting checkout, inventory, authentication, products, and admin analytics.',
      contact: {
        name: 'COSMAN Tech Team',
        email: 'tech@cosman.ma',
      },
    },
    servers: [
      {
        url: config.app.url || 'http://localhost:5000',
        description: 'Current Environment Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/routes/**/*.js',
    './src/app.js',
  ],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Automatically generate/write the swagger.json file on build or manual execution
export const generateSwaggerJson = () => {
  const docsDir = path.join(__dirname, '../../docs');
  
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const outputPath = path.join(docsDir, 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf-8');
  console.log(`📝 Swagger schema written successfully to ${outputPath}`);
};

// If run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateSwaggerJson();
}

export default swaggerSpec;
