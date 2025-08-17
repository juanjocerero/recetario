// server.js
import express from 'express';
import sirv from 'sirv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handler } from './build/handler.js';

const app = express();

// Construir rutas absolutas de forma robusta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const recipeImagesPath = path.join(__dirname, 'static/images/recipes');

// --- Manejador de rutas personalizado para imágenes de recetas ---
// Esta es la solución robusta para servir archivos generados dinámicamente.
app.get('/images/recipes/:fileName', (req, res, next) => {
  const { fileName } = req.params;
  const filePath = path.join(recipeImagesPath, fileName);

  // Verificar si el archivo existe en el momento de la petición
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Log detallado si el archivo no se encuentra o hay un error de permisos
      console.error(`[Image Server Error] Failed to access file. Path: ${filePath}`, err);
      // Pasamos al siguiente manejador (SvelteKit) para que devuelva el 404.
      return next();
    }
    // Si el archivo existe, lo servimos.
    res.sendFile(filePath);
  });
});

// Dejar que SvelteKit maneje el resto de las peticiones
app.use(handler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Serving static recipe images from: ${recipeImagesPath}`);
});