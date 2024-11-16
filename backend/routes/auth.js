const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const authorizeRole = require('../middlewares/authorizeRole');
const authenticateToken = require('../middlewares/authenticateToken');
require('dotenv').config();

const router = express.Router();

// Registro de un nuevo usuario con rol
router.post('/register', authorizeRole('admin'), async (req, res) => {
  const { username, password, email, role } = req.body;

  // Validación de rol
  const userRole = role === 'admin' ? 'admin' : 'viewer'; // Solo 'admin' o 'viewer'

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepara y ejecuta la consulta de inserción
    const query = `INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`;
    const insert = db.prepare(query);
    const result = insert.run(username, hashedPassword, email, userRole);

    res.status(201).send({ user_id: result.lastInsertRowid, message: "Usuario registrado exitosamente" });
  } catch (err) {
    console.error("Error al registrar el usuario:", err.message);
    res.status(500).send("Error al registrar el usuario.");
  }
});

// Inicio de sesión de usuario
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Preparar y ejecutar la consulta de forma síncrona
    const query = `SELECT * FROM users WHERE username = ?`;
    const user = db.prepare(query).get(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send("Credenciales incorrectas.");
    }

    // Crear el token JWT incluyendo el rol del usuario
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
	
	res.cookie('token', token, {
	  httpOnly: true,
	  secure: process.env.NODE_ENV === 'production', // Solo en producción
	  sameSite: 'None', // Necesario para solicitudes entre dominios
	 });

    res.status(200).send({ token, message: "Inicio de sesión exitoso" });
  } catch (err) {
    console.error("Error al obtener el usuario:", err.message);
    res.status(500).send("Error al iniciar sesión.");
  }
});

// Obtener lista de usuarios (solo para admin)
router.get('/users', authorizeRole('admin'), (req, res) => {
  try {
    const query = `SELECT user_id, username, email, role FROM users`;
    const rows = db.prepare(query).all();  // Ejecuta la consulta de forma síncrona
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener usuarios:", err.message);
    res.status(500).send("Error al obtener usuarios.");
  }
});

// Modificar un usuario (solo para admin)
router.put('/users/:user_id', authorizeRole('admin'), (req, res) => {
  const { user_id } = req.params;
  const { email, role } = req.body;

  try {
    const query = `UPDATE users SET email = ?, role = ? WHERE user_id = ?`;
    const update = db.prepare(query);
    const result = update.run(email, role, user_id);

    if (result.changes === 0) {
      return res.status(404).send("Usuario no encontrado.");
    }
    res.status(200).send({ message: "Usuario actualizado exitosamente." });
  } catch (err) {
    console.error("Error al actualizar usuario:", err.message);
    res.status(500).send("Error al actualizar usuario.");
  }
});

// Eliminar un usuario (solo para admin)
router.delete('/users/:user_id', authorizeRole('admin'), (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `DELETE FROM users WHERE user_id = ?`;
    const deleteStmt = db.prepare(query);
    const result = deleteStmt.run(user_id);

    if (result.changes === 0) {
      return res.status(404).send("Usuario no encontrado.");
    }
    res.status(200).send({ message: "Usuario eliminado exitosamente." });
  } catch (err) {
    console.error("Error al eliminar usuario:", err.message);
    res.status(500).send("Error al eliminar usuario.");
  }
});


router.put('/users/changepassword', (req, res) => {
  console.log("Solicitud a change-password recibida sin autenticación"); // Log para verificar
  res.status(200).send({ message: "Ruta alcanzada sin autenticación." });
});



module.exports = router;
