const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Activation CORS
app.use(cors());
app.use(express.json());

// Configuration Express de base
app.get('/', (req, res) => {
  res.send('Master Monster Backend is running');
});

// Status check pour Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Démarrage du serveur HTTP
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

// Configuration WebSocket avec gestion des erreurs
const wss = new WebSocket.Server({ 
  server,
  clientTracking: true,
  handleProtocols: true
});

wss.on('connection', (ws, req) => {
  console.log('New client connected');
  
  ws.isAlive = true;
  
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data) => {
    try {
      console.log('Received:', data.toString());
      ws.send(`Server received: ${data}`);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    ws.isAlive = false;
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Ping/Pong pour maintenir les connexions actives
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});