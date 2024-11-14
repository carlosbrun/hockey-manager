const express = require('express');
const connectMyTeamDb = require('../middlewares/connectMyTeamDb');
const authorizeRole = require('../middlewares/authorizeRole');
const sharp = require('sharp');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');

router.use(connectMyTeamDb); // Aplica el middleware para conectar con la base de datos activa

// Configuración de almacenamiento de logos de equipos
const storage = multer.memoryStorage(); // Almacenamiento en memoria para procesamiento
const upload = multer({ storage: storage });

router.post('/', authorizeRole('admin'), upload.single('logo'), (req, res) => {
  const { name, city, abbreviation, phone, address, is_favorite } = req.body;
  const logoPath = req.file ? path.join('uploads', req.file.filename) : null;

  try {
    const query = `
      INSERT INTO teams (name, city, abbreviation, logo_path, phone, address, is_favorite) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const stmt = req.teamDb.prepare(query);
    const result = stmt.run(name, city, abbreviation, logoPath, phone, address, is_favorite);

    res.status(201).send({ team_id: result.lastInsertRowid });
  } catch (err) {
    console.error("Error al crear el equipo:", err.message);
    res.status(400).send("Error al crear el equipo.");
  }
});


// Obtener todos los equipos
router.get('/', (req, res) => {
  try {
    const query = `SELECT * FROM teams ORDER BY is_favorite DESC, name ASC`;
    const rows = req.teamDb.prepare(query).all();
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener los equipos:", err.message);
    res.status(400).send("Error al obtener los equipos.");
  }
});


// Obtener equipo favorito
router.get('/favorite', (req, res) => {
  try {
    const query = `SELECT * FROM teams WHERE is_favorite = 1`;
    const row = req.teamDb.prepare(query).get();

    if (!row) {
      return res.status(404).send("No se ha seleccionado un equipo favorito.");
    }
    res.status(200).json(row);
  } catch (err) {
    console.error("Error al obtener el equipo favorito:", err.message);
    res.status(500).send("Error al obtener el equipo favorito.");
  }
});

// Obtener un equipo por ID
router.get('/:id', (req, res) => {
  try {
    const teamId = req.params.id;
    const row = req.teamDb.prepare(`SELECT * FROM teams WHERE team_id = ?`).get(teamId);

    if (!row) {
      return res.status(404).send("Equipo no encontrado.");
    }
    res.status(200).json(row);
  } catch (err) {
    console.error("Error al obtener el equipo:", err.message);
    res.status(500).send("Error al obtener el equipo.");
  }
});

// Actualizar un equipo (incluyendo logo, teléfono y dirección)
router.put('/:id', authorizeRole('admin'), upload.single('logo'), async (req, res) => {
  try {
    const teamId = req.params.id;
    const { name, city, abbreviation, phone, address, is_favorite } = req.body;
    let logoPath = null;

    if (req.file) {
      logoPath = path.join('uploads/badges', `${teamId}.png`);
      await sharp(req.file.buffer)
        .resize(512, 512)
        .toFormat('png')
        .toFile(path.join(__dirname, '..', logoPath));
    }

    const query = logoPath
      ? `UPDATE teams SET name = ?, city = ?, abbreviation = ?, logo_path = ?, phone = ?, address = ?, is_favorite = ? WHERE team_id = ?`
      : `UPDATE teams SET name = ?, city = ?, abbreviation = ?, phone = ?, address = ?, is_favorite = ? WHERE team_id = ?`;

    const result = req.teamDb.prepare(query).run(
      name, city, abbreviation, logoPath ? `/${logoPath}` : null, phone, address, is_favorite, teamId
    );

    if (result.changes === 0) {
      return res.status(404).send("Equipo no encontrado.");
    }
    res.status(200).send("Equipo actualizado con éxito.");
  } catch (err) {
    console.error("Error al actualizar el equipo:", err.message);
    res.status(500).send("Error al actualizar el equipo.");
  }
});

// Eliminar un equipo
router.delete('/:id', authorizeRole('admin'), (req, res) => {
  try {
    const teamId = req.params.id;
    const result = req.teamDb.prepare(`DELETE FROM teams WHERE team_id = ?`).run(teamId);

    if (result.changes === 0) {
      return res.status(404).send("Equipo no encontrado.");
    }
    res.status(200).send("Equipo eliminado con éxito.");
  } catch (err) {
    console.error("Error al eliminar el equipo:", err.message);
    res.status(500).send("Error al eliminar el equipo.");
  }
});

module.exports = router;
