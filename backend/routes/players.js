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
  req.teamDb.all(
    `SELECT * FROM players WHERE team_id = (SELECT team_id FROM teams WHERE is_favorite = 1) order by number ASC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error al obtener los jugadores:", err.message);
        res.status(400).send("Error al obtener los jugadores.");
      } else {
        res.status(200).json(rows);
      }
    }
  );
});

// Endpoint para obtener la tabla de goleadores de mi equipo favorito
router.get('/top-scorers', (req, res) => {
  const query = `
    SELECT players.player_id, players.name, players.number, players.photo_path,
           IFNULL(SUM(match_events.event_number), 0) AS total_goals
    FROM players
    LEFT JOIN match_events ON players.player_id = match_events.player_id AND match_events.event_type = 'GOAL'
    WHERE players.team_id = (SELECT team_id FROM teams WHERE is_favorite = 1)
    GROUP BY players.player_id
    ORDER BY total_goals DESC, players.name ASC
  `;
  
  req.teamDb.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener la tabla de goleadores:", err.message);
      res.status(500).send("Error al obtener la tabla de goleadores.");
    } else {
      res.status(200).json(rows);
    }
  });
});

// Endpoint para obtener los goles de un jugador por partido
router.get('/:id/goals', (req, res) => {
  const { id } = req.params;

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

  req.teamDb.all(query, [id], (err, rows) => {
    if (err) {
      console.error("Error al obtener los goles del jugador:", err.message);
      res.status(500).send("Error al obtener los goles del jugador.");
    } else {
      res.status(200).json(rows);
    }
  });
});

// Obtener un jugador específico por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  req.teamDb.get(`SELECT * FROM players WHERE player_id = ?`, [id], (err, row) => {
    if (err) {
      console.error("Error al obtener el jugador:", err.message);
      res.status(400).send("Error al obtener el jugador.");
    } else if (!row) {
      res.status(404).send("Jugador no encontrado.");
    } else {
      res.status(200).json(row);
    }
  });
});

// Crear un nuevo jugador con foto
router.post('/', authorizeRole('admin'), upload.single('photo'), async (req, res) => {
  const { name, number, position, birthdate, team_id } = req.body;

  if (req.file) {
    const photoFileName = `${number}.png`;
    const photoPath = path.join(__dirname, '../uploads/players/', photoFileName);

    try {
      // Procesar la imagen y guardarla como PNG de 512x512 px
      await sharp(req.file.buffer)
        .resize(512, 512)
        .toFormat('png')
        .toFile(photoPath);
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      return res.status(500).send("Error al procesar la imagen.");
    }
  }

  req.teamDb.run(
    `INSERT INTO players (name, number, photo_path, position, birthdate, team_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, number, req.file ? `/uploads/players/${number}.png` : null, position, birthdate, team_id],
    function (err) {
      if (err) {
        console.error("Error al crear el jugador:", err.message);
        res.status(400).send(`Error al crear el jugador: ${err.message}`);
      } else {
        res.status(201).send({ player_id: this.lastID, message: "Jugador creado con éxito" });
      }
    }
  );
});

// Actualizar un jugador con foto
router.put('/:id', authorizeRole('admin'), upload.single('photo'), async (req, res) => {
  const playerId = req.params.id;
  const { name, number, position, birthdate, team_id } = req.body;

  let photoPath = null;

  if (req.file) {
    photoPath = path.join(__dirname, '../uploads/players/', `${number}.png`);
    try {
      // Procesar la imagen cargada
      await sharp(req.file.buffer)
        .resize(512, 512)
        .toFormat('png')
        .toFile(photoPath);
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      return res.status(500).send("Error al procesar la imagen.");
    }
  }

  const query = photoPath
    ? `UPDATE players SET name = ?, number = ?, photo_path = ?, position = ?, birthdate = ?, team_id = ? WHERE player_id = ?`
    : `UPDATE players SET name = ?, number = ?, position = ?, birthdate = ?, team_id = ? WHERE player_id = ?`;

  const params = photoPath
    ? [name, number, `/uploads/players/${number}.png`, position, birthdate, team_id, playerId]
    : [name, number, position, birthdate, team_id, playerId];

  req.teamDb.run(query, params, function (err) {
    if (err) {
      console.error("Error al actualizar el jugador:", err.message);
      res.status(400).send("Error al actualizar el jugador.");
    } else if (this.changes === 0) {
      res.status(404).send("Jugador no encontrado.");
    } else {
      res.status(200).send("Jugador actualizado con éxito.");
    }
  });
});

// Eliminar un jugador por ID
router.delete('/:id', authorizeRole('admin'), (req, res) => {
  const { id } = req.params;
  req.teamDb.run(`DELETE FROM players WHERE player_id = ?`, [id], function (err) {
    if (err) {
      console.error("Error al eliminar el jugador:", err.message);
      res.status(400).send("Error al eliminar el jugador.");
    } else if (this.changes === 0) {
      res.status(404).send("Jugador no encontrado.");
    } else {
      res.status(200).send("Jugador eliminado con éxito.");
    }
  });
});

module.exports = router;
