const express = require('express');
const connectMyTeamDb = require('../middlewares/connectMyTeamDb');
const authorizeRole = require('../middlewares/authorizeRole');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const router = express.Router();
router.use(connectMyTeamDb);

// Configuración de almacenamiento de fotos con multer
const storage = multer.memoryStorage(); // Almacenamiento en memoria para procesamiento
const upload = multer({ storage: storage });

// Obtener todos los jugadores (solo del equipo favorito)
router.get('/', (req, res) => {
  try {
    const query = `
      SELECT * FROM players 
      WHERE team_id = (SELECT team_id FROM teams WHERE is_favorite = 1)
      ORDER BY number ASC
    `;
    const rows = req.teamDb.prepare(query).all();  // Ejecuta la consulta de forma síncrona
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener los jugadores:", err.message);
    res.status(400).send("Error al obtener los jugadores.");
  }
});

// Endpoint para obtener la tabla de goleadores de mi equipo favorito
router.get('/top-scorers', (req, res) => {
  try {
    const query = `
      SELECT players.player_id, players.name, players.number, players.photo_path,
             IFNULL(SUM(match_events.event_number), 0) AS total_goals
      FROM players
      LEFT JOIN match_events ON players.player_id = match_events.player_id AND match_events.event_type = 'GOAL'
      WHERE players.team_id = (SELECT team_id FROM teams WHERE is_favorite = 1)
      GROUP BY players.player_id
      ORDER BY total_goals DESC, players.name ASC
    `;
    
    const rows = req.teamDb.prepare(query).all(); // Ejecuta la consulta de forma síncrona
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener la tabla de goleadores:", err.message);
    res.status(500).send("Error al obtener la tabla de goleadores.");
  }
});

// Endpoint para obtener los goles de un jugador por partido
router.get('/:id/goals', (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT matches.round_number, matches.date, matches.score_team_1, matches.score_team_2, 
             teams_local.name AS local_team, teams_visitor.name AS visitor_team, 
             match_events.event_number AS goals
      FROM match_events
      JOIN matches ON match_events.match_id = matches.match_id
      JOIN teams AS teams_local ON matches.team_1_id = teams_local.team_id
      JOIN teams AS teams_visitor ON matches.team_2_id = teams_visitor.team_id
      WHERE match_events.player_id = ? AND match_events.event_type = 'GOAL'
      ORDER BY matches.round_number ASC;
    `;
    
    const rows = req.teamDb.prepare(query).all(id);  // Ejecuta la consulta de forma síncrona
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener los goles del jugador:", err.message);
    res.status(500).send("Error al obtener los goles del jugador.");
  }
});


// Obtener un jugador específico por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const query = `SELECT * FROM players WHERE player_id = ?`;
    const row = req.teamDb.prepare(query).get(id);  // Ejecuta la consulta de forma síncrona

    if (!row) {
      return res.status(404).send("Jugador no encontrado.");
    }
    res.status(200).json(row);
  } catch (err) {
    console.error("Error al obtener el jugador:", err.message);
    res.status(400).send("Error al obtener el jugador.");
  }
});


// Crear un nuevo jugador con foto
router.post('/', authorizeRole('admin'), upload.single('photo'), async (req, res) => {
  const { name, number, position, birthdate, team_id } = req.body;

  let photoPath = null;
  
  if (req.file) {
    const photoFileName = `${number}.png`;
    photoPath = `/uploads/players/${photoFileName}`;
    const fullPhotoPath = path.join(__dirname, '../uploads/players/', photoFileName);

    try {
      // Procesar la imagen y guardarla como PNG de 512x512 px
      await sharp(req.file.buffer)
        .resize(512, 512)
        .toFormat('png')
        .toFile(fullPhotoPath);
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      return res.status(500).send("Error al procesar la imagen.");
    }
  }

  try {
    const query = `INSERT INTO players (name, number, photo_path, position, birthdate, team_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const insert = req.teamDb.prepare(query);
    const result = insert.run(name, number, photoPath, position, birthdate, team_id);
    
    res.status(201).send({ player_id: result.lastInsertRowid, message: "Jugador creado con éxito" });
  } catch (err) {
    console.error("Error al crear el jugador:", err.message);
    res.status(400).send(`Error al crear el jugador: ${err.message}`);
  }
});

// Actualizar un jugador con foto
router.put('/:id', authorizeRole('admin'), upload.single('photo'), async (req, res) => {
  const playerId = req.params.id;
  const { name, number, position, birthdate, team_id } = req.body;

  let photoPath = null;

  if (req.file) {
    const photoFileName = `${number}.png`;
    photoPath = `/uploads/players/${photoFileName}`;
    const fullPhotoPath = path.join(__dirname, '../uploads/players/', photoFileName);

    try {
      // Procesar la imagen cargada
      await sharp(req.file.buffer)
        .resize(512, 512)
        .toFormat('png')
        .toFile(fullPhotoPath);
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      return res.status(500).send("Error al procesar la imagen.");
    }
  }

  const query = photoPath
    ? `UPDATE players SET name = ?, number = ?, photo_path = ?, position = ?, birthdate = ?, team_id = ? WHERE player_id = ?`
    : `UPDATE players SET name = ?, number = ?, position = ?, birthdate = ?, team_id = ? WHERE player_id = ?`;

  const params = photoPath
    ? [name, number, photoPath, position, birthdate, team_id, playerId]
    : [name, number, position, birthdate, team_id, playerId];

  try {
    const update = req.teamDb.prepare(query);
    const result = update.run(...params);

    if (result.changes === 0) {
      return res.status(404).send("Jugador no encontrado.");
    }
    res.status(200).send("Jugador actualizado con éxito.");
  } catch (err) {
    console.error("Error al actualizar el jugador:", err.message);
    res.status(400).send("Error al actualizar el jugador.");
  }
});

// Eliminar un jugador por ID
router.delete('/:id', authorizeRole('admin'), (req, res) => {
  const { id } = req.params;

  try {
    const query = `DELETE FROM players WHERE player_id = ?`;
    const deleteStmt = req.teamDb.prepare(query);
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return res.status(404).send("Jugador no encontrado.");
    }
    res.status(200).send("Jugador eliminado con éxito.");
  } catch (err) {
    console.error("Error al eliminar el jugador:", err.message);
    res.status(400).send("Error al eliminar el jugador.");
  }
});


module.exports = router;
