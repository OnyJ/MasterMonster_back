import express from 'express';

const io = require("socket.io");
const app = express();
const port = process.env.PORT || 8080;


io.on('connection', () => { 
  console.log('Un client est connecté');
});

server.listen(port);


io.on('disconnect', () => {
  clearInterval(interval);
});