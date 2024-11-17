const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const session = require('express-session');

require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
});

console.log("Servidor Express iniciándose...");
console.log(`Entorno de ejecución: ${process.env.NODE_ENV}`);

const app = express();
app.use(bodyParser.json());
// Configuración de CORS con credenciales

app.use(cors({
  origin: process.env.FRONTEND_URL, // Reemplaza con tu URL de GitHub Pages
  credentials: true, // Permite enviar cookies o encabezados de autorización
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
}));

app.use('/uploads', express.static('uploads')); // Servir archivos de la carpeta de fotos

app.use(session({
  secret: 'GJhhgdydy73892.32233-',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Solo en producción con HTTPS
    httpOnly: true, // Previene acceso a cookies vía JavaScript
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Protege contra ataques CSRF
  }
}));

// Importa las rutas
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const matchRoutes = require('./routes/matches');
const teamRoutes = require('./routes/teams');
const myteamsRoutes = require('./routes/myteams'); // Importa myteams.js

console.log("Rutas importadas...");

const authenticateToken = require('./middlewares/authenticateToken');
const connectMyTeamDb = require('./middlewares/connectMyTeamDb');

app.use('/auth', authenticateToken, connectMyTeamDb, authRoutes);
app.use('/players', authenticateToken, connectMyTeamDb, playerRoutes);
app.use('/matches', authenticateToken, connectMyTeamDb, matchRoutes);
app.use('/teams', authenticateToken, connectMyTeamDb, teamRoutes);
app.use('/myteams', authenticateToken, connectMyTeamDb, myteamsRoutes); // Configura myteams.js

console.log("Rutas configuradas...");

// Configuración del puerto
const PORT = process.env.PORT || 3000;
const SERVER_URL = process.env.SERVER_URL;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en ${SERVER_URL}:${PORT}`);
});
