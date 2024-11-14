const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const session = require('express-session');

require('dotenv').config();

console.log("Servidor Express iniciándose...");

const app = express();
app.use(bodyParser.json());
// Configuración de CORS con credenciales
app.use(cors({
  origin: process.env.SERVER_URL+':'+process.env.SERVER_PORT, // Reemplaza con el dominio de tu frontend
  credentials: true
}));
app.use('/uploads', express.static('uploads')); // Servir archivos de la carpeta de fotos
app.use(session({
  secret: 'GJhhgdydy73892.32233-', // Cambia esto por una clave secreta para tu aplicación
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Asegúrate de que esté en `true` solo en producción con HTTPS
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
