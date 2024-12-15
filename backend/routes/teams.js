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

    // Convertir `is_favorite` en booleano
    row.is_favorite = !!row.is_favorite;

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

    // Si se intenta marcar como favorito
    if (is_favorite === '1') {
      const existingFavorite = req.teamDb.prepare(`SELECT team_id FROM teams WHERE is_favorite = 1`).get();
      if (existingFavorite && existingFavorite.team_id !== parseInt(teamId)) {
        return res.status(400).send("Ya existe un equipo favorito. Desmarca el favorito actual antes de establecer otro.");
      }
    }

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
    
    const params = logoPath
      ? [name, city, abbreviation, `/${logoPath}`, phone, address, is_favorite, teamId]
      : [name, city, abbreviation, phone, address, is_favorite, teamId];
    
    const result = req.teamDb.prepare(query).run(...params);

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

    // Eliminar eventos del partido
    const deleteEvents = req.teamDb.prepare(`DELETE FROM match_events WHERE match_id in (select distinct(match_id) from matches where team_1_id = ? or team_2_id = ?)`);
    const resultEvents = deleteEvents.run(teamId, teamId);

    // Eliminar jugadores convocados del partido
    const deleteConvocations = req.teamDb.prepare(`DELETE FROM convocatorias WHERE match_id in (select distinct(match_id) from matches where team_1_id = ? or team_2_id = ?)`);
    const resultConvocations = deleteConvocations.run(teamId, teamId);

    // Eliminar los partidos
    const deleteMatch = req.teamDb.prepare(`DELETE FROM matches WHERE match_id in (select distinct(match_id) from matches where team_1_id = ? or team_2_id = ?)`);
    const resultMatch = deleteMatch.run(teamId, teamId);

    // Eliminar los partidos
    const deletePlayer = req.teamDb.prepare(`DELETE FROM players WHERE team_id  = ?`);
    const resultPlayer = deletePlayer.run(teamId);

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
