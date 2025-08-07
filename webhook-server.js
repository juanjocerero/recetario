const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const SECRET = 'tu_secreto_webhook'; // Cambia esto por un secreto seguro

app.use(bodyParser.json());

app.post('/deploy', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  
  if (signature !== digest) {
    return res.status(401).send('Unauthorized');
  }
  
  console.log('🔄 Webhook recibido. Iniciando despliegue...');
  
  // Ejecutar el script de despliegue
  exec('node deploy.mjs', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${stderr}`);
      return res.status(500).send('Deployment failed');
    }
    console.log(`Output: ${stdout}`);
    res.send('Deployment successful');
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Webhook server running on port ${port}`));