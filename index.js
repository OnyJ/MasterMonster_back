const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuration Express
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Master Monster Backend is running');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serveur HTTP
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

// Serveur WebSocket
const wss = new WebSocket.Server({ 
  server,
  clientTracking: true,
  // Ajouter ces options pour plus de stabilité
  pingTimeout: 60000, // 60 secondes
  pingInterval: 25000, // 25 secondes
});

// Gestion des commandes
function handleCommand(ws, command) {
  console.log('Command received:', command);

  switch (command) {
      case 'help':
          ws.send(JSON.stringify({
              type: 'help',
              content: [
                  'Available commands:',
                  '',
                  '/help : Display this help message - ',
                  '/ping : Test connection - ',
                  '/status : Server status - ',
                  '/hello : Send hello to all connected clients - ',
                  '/clients : Number of connected clients - ',
                  '/time : Current server time - ',
                  '/uptime : Server uptime - ',
                  '/clear : Clear chat messages - ',
                  '/whisper <user> <message> : Send private message'
              ]
          }));
          break;
      case 'ping': {
        const startTime = Date.now();
        ws.ping(() => {
            const latency = Date.now() - startTime;
            ws.send(`Pong! Latency: ${latency}ms`);
        });
        break;
      }
      case 'status':
        ws.send('Server is running');
        break;
      case 'clients': {
        const clientCount = wss.clients.size;
        ws.send(`Connected clients: ${clientCount}`);
        break;
      }
      case 'time': {
        const time = new Date().toLocaleTimeString();
        ws.send(`Server time: ${time}`);
        break;
      }
      case 'uptime': {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        ws.send(`Server uptime: ${hours}h ${minutes}m ${seconds}s`);
        break;
      }
      case 'clear':
        broadcastMessage(ws, '/clear');
        break;
      case 'hello':
        // Diffuser le message à tous les clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send('Someone says hello to everyone!');
          }
        });
        break;
      default:
        // Gestion des commandes avec paramètres
        if (command.startsWith('whisper ')) {
          const parts = command.split(' ');
          if (parts.length >= 3) {
            const targetUser = parts[1];
            const message = parts.slice(2).join(' ');
            // Implémentation à faire pour la gestion des utilisateurs
            ws.send(`Private message to ${targetUser}: ${message}`);
          } else {
            ws.send('Usage: /whisper <user> <message>');
          }
        } else {
          ws.send(`Unknown command: ${command}`);
        }
  }
}

// Gestion des messages
function broadcastMessage(sender, message) {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Connexion WebSocket
wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.isAlive = true;

  // Gestionnaire de pong
  ws.on('pong', () => {
    ws.isAlive = true;
    console.log('Client pong received');
  });

  // Interval de ping pour chaque client
  const pingInterval = setInterval(() => {
    if (ws.isAlive === false) {
      console.log('Client connection lost - terminating');
      clearInterval(pingInterval);
      return ws.terminate();
    }

    ws.isAlive = false;
    try {
      ws.ping();
      console.log('Ping sent to client');
    } catch (error) {
      console.error('Error sending ping:', error);
      clearInterval(pingInterval);
      ws.terminate();
    }
  }, 30000);

  // Nettoyer l'interval à la fermeture
  ws.on('close', () => {
    console.log('Client disconnected - cleaning up');
    clearInterval(pingInterval);
  });

  // Gestion des messages
  ws.on('message', (data) => {
    try {
      const message = data.toString();
      console.log('Message reçu:', message);

      if (message.startsWith('/')) {
        // Enlever le '/' et les espaces au début et à la fin
        const command = message.slice(1).trim().toLowerCase();
        console.log('Commande détectée:', command);
        handleCommand(ws, command);
      } else {
        console.log('Message normal:', message);
        broadcastMessage(ws, message);
      }
    } catch (error) {
      console.error('Error:', error);
      ws.send('Error: Invalid message format');
    }
  });

  // Gestion de la déconnexion
  ws.on('close', () => {
    console.log('Client disconnected');
    ws.isAlive = false;
  });

  // Gestion des erreurs
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Ping initial
  ws.send('Welcome to the server!');
});

// Nettoyage à la fermeture
wss.on('close', () => {
  clearInterval(interval);
});