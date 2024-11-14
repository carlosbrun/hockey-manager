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

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`;
  db.run(query, [username, hashedPassword, email, userRole], function (err) {
    if (err) {
      console.error("Error al registrar el usuario:", err.message);
      return res.status(500).send("Error al registrar el usuario.");
    }
    res.status(201).send({ user_id: this.lastID, message: "Usuario registrado exitosamente" });
  });
});

// Inicio de sesión de usuario
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], async (err, user) => {
    if (err) {
      console.error("Error al obtener el usuario:", err.message);
      return res.status(500).send("Error al iniciar sesión.");
    }
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send("Credenciales incorrectas.");
    }

    // Crear el token JWT incluyendo el rol del usuario
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).send({ token, message: "Inicio de sesión exitoso" });
  });
});

// Obtener lista de usuarios (solo para admin)
router.get('/users', authorizeRole('admin'), (req, res) => {
  const query = `SELECT user_id, username, email, role FROM users`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener usuarios:", err.message);
      return res.status(500).send("Error al obtener usuarios.");
    }
    res.status(200).json(rows);
  });
});

// modificar un usuario (solo para admin)
router.put('/users/:user_id', authorizeRole('admin'), (req, res) => {
  const { user_id } = req.params;
  const { email, role } = req.body;

  const query = `UPDATE users SET email = ?, role = ? WHERE user_id = ?`;
  db.run(query, [email, role, user_id], function (err) {
    if (err) {
      console.error("Error al actualizar usuario:", err.message);
      return res.status(500).send("Error al actualizar usuario.");
    }
    if (this.changes === 0) {
      return res.status(404).send("Usuario no encontrado.");
    }
    res.status(200).send({ message: "Usuario actualizado exitosamente." });
  });
});

// Eliminar un usuario (solo para admin)
router.delete('/users/:user_id', authorizeRole('admin'), (req, res) => {
  const { user_id } = req.params;

  const query = `DELETE FROM users WHERE user_id = ?`;
  db.run(query, [user_id], function (err) {
    if (err) {
      console.error("Error al eliminar usuario:", err.message);
      return res.status(500).send("Error al eliminar usuario.");
    }
    if (this.changes === 0) {
      return res.status(404).send("Usuario no encontrado.");
    }
    res.status(200).send({ message: "Usuario eliminado exitosamente." });
  });
});

router.put('/users/changepassword', (req, res) => {
  console.log("Solicitud a change-password recibida sin autenticación"); // Log para verificar
  res.status(200).send({ message: "Ruta alcanzada sin autenticación." });
});



module.exports = router;
