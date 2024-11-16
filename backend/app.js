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
  origin: process.env.FRONTEND_URL, // Reemplaza con el dominio de tu frontend
  credentials: true
}));

app.use(cors({
  origin: process.env.FRONTEND_URL, // Reemplaza con tu URL de GitHub Pages
  credentials: true, // Permite enviar cookies o encabezados de autorización
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
}));

app.use('/uploads', express.static('uploads')); // Servir archivos de la carpeta de fotos
app.use(session({
  secret: 'GJhhgdydy73892.32233-', // Cambia esto por una clave secreta para tu aplicación
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  }
}));

// Importa las rutas
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const matchRoutes = require('./routes/matches');
const teamRoutes = require('./routes/teams');
const myteamsRoutes = require('./routes/myteams'); // Importa myteams.js

console.log("Rutas importadas...");

app.use('/auth', authRoutes);
app.use('/players', playerRoutes);
app.use('/matches', matchRoutes);
app.use('/teams', teamRoutes);
app.use('/myteams', myteamsRoutes); // Configura myteams.js

console.log("Rutas configuradas...");

// Configuración del puerto
const PORT = process.env.PORT || 3000;
const SERVER_URL = process.env.SERVER_URL;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en ${SERVER_URL}:${PORT}`);
});
