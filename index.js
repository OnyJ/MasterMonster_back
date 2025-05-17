const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

// Configuration Express de base
app.get('/', (req, res) => {
  res.send('Master Monster Backend is running');
});

// Démarrage du serveur HTTP
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Configuration WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', (data) => {
    console.log('Received:', data);
    ws.send(`Server received: ${data}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});