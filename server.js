// server.js
import express from 'express';
import sirv from 'sirv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handler } from './build/handler.js';

const app = express();

// Construir rutas absolutas de forma robusta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const recipeImagesPath = path.join(__dirname, 'static/images/recipes');

// Servir imágenes de recetas generadas dinámicamente
app.use('/images/recipes', sirv(recipeImagesPath, {
  dev: process.env.NODE_ENV === 'development',
  etag: true,
  maxAge: 31536000, // 1 año
  immutable: true
}));

// Dejar que SvelteKit maneje el resto de las peticiones
app.use(handler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Serving static recipe images from: ${recipeImagesPath}`);
});
