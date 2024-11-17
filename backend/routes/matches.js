const express = require('express');
const connectMyTeamDb = require('../middlewares/connectMyTeamDb');
const authorizeRole = require('../middlewares/authorizeRole');
const router = express.Router();

router.use(connectMyTeamDb); // Aplica el middleware para conectar con la base de datos activa

// Crear un nuevo partido
router.post('/create', authorizeRole('admin'), (req, res) => {
  const { team_1_id, team_2_id, date, location, score_team_1, score_team_2, round_number, details } = req.body;

  try {
    const query = `
      INSERT INTO matches (team_1_id, team_2_id, date, location, score_team_1, score_team_2, round_number, details) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insert = req.teamDb.prepare(query);
    const result = insert.run(team_1_id, team_2_id, date, location, score_team_1, score_team_2, round_number, details);

    res.status(201).send({ match_id: result.lastInsertRowid });
  } catch (err) {
    console.error("Error al crear el partido:", err.message);
    res.status(400).send("Error al crear el partido.");
  }
});

// Actualizar el resultado, fecha y/o número de jornada de un partido
router.put('/update/:match_id', authorizeRole('admin'), (req, res) => {
  const { match_id } = req.params;
  const { score_team_1, score_team_2, location, date, round_number, details } = req.body;

  // Validación: si uno de los puntajes está presente, el otro también debe estarlo
  const scoreTeam1Provided = score_team_1 !== undefined;
  const scoreTeam2Provided = score_team_2 !== undefined;

  if ((scoreTeam1Provided && !scoreTeam2Provided) || (!scoreTeam1Provided && scoreTeam2Provided)) {
    return res.status(400).send("Debe proporcionar ambos puntajes, 'score_team_1' y 'score_team_2', o ninguno.");
  }

  // Construcción dinámica de la consulta SQL según los campos presentes
  let fieldsToUpdate = [];
  let values = [];

  if (scoreTeam1Provided && scoreTeam2Provided) {
    fieldsToUpdate.push("score_team_1 = ?", "score_team_2 = ?");
    values.push(score_team_1, score_team_2);
  }

  if (location !== undefined) {
    fieldsToUpdate.push("location = ?");
    values.push(location === '' ? null : location);
  }

  if (date) {
    fieldsToUpdate.push("date = ?");
    values.push(date);
  }

  if (details) {
    fieldsToUpdate.push("details = ?");
    values.push(details);
  }

  if (round_number !== undefined) {
    fieldsToUpdate.push("round_number = ?");
    values.push(round_number);
  }

  if (fieldsToUpdate.length === 0) {
    return res.status(400).send("Debe proporcionar al menos un campo para actualizar.");
  }

  values.push(match_id); // Agrega match_id para la condición WHERE

  const query = `UPDATE matches SET ${fieldsToUpdate.join(', ')} WHERE match_id = ?`;

  try {
    const update = req.teamDb.prepare(query);
    const result = update.run(...values);

    if (result.changes === 0) {
      return res.status(404).send("Partido no encontrado.");
    }
    res.status(200).send({ message: "Partido actualizado correctamente." });
  } catch (err) {
    console.error("Error al actualizar el partido:", err.message);
    res.status(500).send("Error al actualizar el partido.");
  }
});


// Eliminar un partido
router.delete('/:match_id', authorizeRole('admin'), (req, res) => {
  const { match_id } = req.params;

  try {
    // Eliminar eventos del partido
    const deleteEvents = req.teamDb.prepare(`DELETE FROM match_events WHERE match_id = ?`);
    const resultEvents = deleteEvents.run(match_id);

    // Eliminar jugadores convocados del partido
    const deleteConvocations = req.teamDb.prepare(`DELETE FROM convocatorias WHERE match_id = ?`);
    const resultConvocations = deleteConvocations.run(match_id);

    // Eliminar el partido
    const deleteMatch = req.teamDb.prepare(`DELETE FROM matches WHERE match_id = ?`);
    const resultMatch = deleteMatch.run(match_id);

    // Verificar si el partido fue encontrado
    if (resultMatch.changes === 0) {
      return res.status(404).send("Partido no encontrado.");
    }

    res.status(200).send({ message: "Partido eliminado correctamente." });
  } catch (err) {
    console.error("Error al eliminar el partido o sus datos asociados:", err.message);
    res.status(500).send("Error al eliminar el partido o sus datos asociados.");
  }
});

// Obtener la clasificación
router.get('/standings', (req, res) => {
  try {
    // Recupera todos los equipos junto con la información de si son favoritos
    const teams = req.teamDb.prepare(`SELECT team_id, name, is_favorite FROM teams`).all();

    // Recuperar todos los partidos con resultados anotados
    const matches = req.teamDb.prepare(
      `SELECT * FROM matches WHERE score_team_1 IS NOT NULL AND score_team_2 IS NOT NULL`
    ).all();

    // Inicializar un objeto de clasificación para cada equipo
    const standings = teams.map(team => ({
      team_id: team.team_id,
      name: team.name,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
      is_favorite: team.is_favorite,
    }));

    // Crear un índice de clasificación por ID de equipo para actualizar más rápido
    const standingsIndex = Object.fromEntries(
      standings.map(team => [team.team_id, team])
    );

    // Calcular estadísticas basadas en los resultados de los partidos
    matches.forEach(match => {
      const { team_1_id, team_2_id, score_team_1, score_team_2 } = match;
      const team1 = standingsIndex[team_1_id];
      const team2 = standingsIndex[team_2_id];

      // Actualizar partidos jugados
      team1.played += 1;
      team2.played += 1;

      // Actualizar goles a favor y en contra
      team1.goals_for += score_team_1;
      team1.goals_against += score_team_2;
      team2.goals_for += score_team_2;
      team2.goals_against += score_team_1;

      // Actualizar resultados y puntos
      if (score_team_1 > score_team_2) {
        // Victoria para el equipo 1
        team1.won += 1;
        team1.points += 3;
        team2.lost += 1;
      } else if (score_team_1 < score_team_2) {
        // Victoria para el equipo 2
        team2.won += 1;
        team2.points += 3;
        team1.lost += 1;
      } else {
        // Empate
        team1.draw += 1;
        team2.draw += 1;
        team1.points += 1;
        team2.points += 1;
      }
    });

    // Ordenar la clasificación por puntos y diferencia de goles
    standings.sort((a, b) => b.points - a.points || (b.goals_for - b.goals_against) - (a.goals_for - a.goals_against));

    res.json(standings);
  } catch (error) {
    console.error("Error al calcular la clasificación:", error);
    res.status(500).send("Error al calcular la clasificación.");
  }
});

// Obtener todos los partidos
router.get('/', (req, res) => {
  try {
    const query = `SELECT * FROM matches`;
    const rows = req.teamDb.prepare(query).all();
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener los partidos:", err.message);
    res.status(500).send("Error al obtener los partidos.");
  }
});

// Obtener un partido específico por match_id
router.get('/:match_id', (req, res) => {
  const { match_id } = req.params;
  const query = `SELECT * FROM matches WHERE match_id = ?`;

  try {
    const row = req.teamDb.prepare(query).get(match_id);
    if (!row) {
      return res.status(404).send("Partido no encontrado.");
    }
    res.status(200).json(row);
  } catch (err) {
    console.error("Error al obtener el partido:", err.message);
    res.status(500).send("Error al obtener el partido.");
  }
});


// Obtener todos los partidos de un equipo específico por team_id
router.get('/team/:team_id', (req, res) => {
  const { team_id } = req.params;
  const query = `
    SELECT * FROM matches 
    WHERE team_1_id = ? OR team_2_id = ?
  `;

  try {
    const rows = req.teamDb.prepare(query).all(team_id, team_id);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener los partidos del equipo:", err.message);
    res.status(500).send("Error al obtener los partidos del equipo.");
  }
});


// Obtener todos los partidos de una jornada específica por round_number
router.get('/round/:round_number', (req, res) => {
  const { round_number } = req.params;
  const query = `SELECT * FROM matches WHERE round_number = ?`;

  try {
    const rows = req.teamDb.prepare(query).all(round_number);
    if (rows.length === 0) {
      return res.status(404).send("No se encontraron partidos para esta jornada.");
    }
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener los partidos de la jornada:", err.message);
    res.status(500).send("Error al obtener los partidos de la jornada.");
  }
});


// Añadir un gol para un jugador en un partido
router.post('/:match_id/events/goal', authorizeRole('admin'), (req, res) => {
  const { match_id } = req.params;
  const { player_id, event_number } = req.body;

  if (!player_id || !event_number) {
    return res.status(400).send("Se requiere 'player_id' y 'event_number' para registrar un gol.");
  }

  const query = `
    INSERT INTO match_events (match_id, player_id, event_type, event_number)
    VALUES (?, ?, 'GOAL', ?)
  `;

  try {
    const result = req.teamDb.prepare(query).run(match_id, player_id, event_number);
    res.status(201).send({ message: "Gol registrado con éxito", event_id: result.lastInsertRowid });
  } catch (err) {
    console.error("Error al registrar el gol:", err.message);
    res.status(500).send("Error al registrar el gol.");
  }
});


// Obtener todos los goles de un partido específico
router.get('/:match_id/events/goals', (req, res) => {
  const { match_id } = req.params;

  const query = `
    SELECT match_events.*, players.name AS player_name, players.photo_path AS player_photo
    FROM match_events
    JOIN players ON match_events.player_id = players.player_id
    WHERE match_events.match_id = ? AND match_events.event_type = 'GOAL'
  `;

  try {
    const rows = req.teamDb.prepare(query).all(match_id);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener los goles del partido:", err.message);
    res.status(500).send("Error al obtener los goles del partido.");
  }
});


// Eliminar un gol de un jugador en un partido
router.delete('/:match_id/events/goal/:event_id', authorizeRole('admin'), (req, res) => {
  const { match_id, event_id } = req.params;

  const query = `DELETE FROM match_events WHERE match_id = ? AND event_id = ? AND event_type = 'GOAL'`;

  try {
    const stmt = req.teamDb.prepare(query);
    const result = stmt.run(match_id, event_id);

    if (result.changes === 0) {
      return res.status(404).send("Evento no encontrado.");
    }
    
    res.status(200).send({ message: "Gol eliminado con éxito" });
  } catch (err) {
    console.error("Error al eliminar el gol:", err.message);
    res.status(500).send("Error al eliminar el gol.");
  }
});


// Obtener convocatoria de un partido
router.get('/:match_id/convocatoria', (req, res) => {
  const { match_id } = req.params;
  const query = `
    SELECT players.player_id, players.name, players.number 
    FROM players
    INNER JOIN convocatorias ON players.player_id = convocatorias.player_id
    WHERE convocatorias.match_id = ?
  `;
  try {
    const stmt = req.teamDb.prepare(query);
    const rows = stmt.all(match_id);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al obtener la convocatoria:", err.message);
    res.status(500).send("Error al obtener la convocatoria.");
  }
});

// Añadir jugador a la convocatoria
router.post('/:match_id/convocatoria/:player_id', (req, res) => {
  const { match_id, player_id } = req.params;
  const query = `INSERT INTO convocatorias (match_id, player_id) VALUES (?, ?)`;
  try {
    const stmt = req.teamDb.prepare(query);
    stmt.run(match_id, player_id);
    res.status(201).send("Jugador añadido a la convocatoria.");
  } catch (err) {
    console.error("Error al añadir el jugador a la convocatoria:", err.message);
    res.status(500).send("Error al añadir el jugador a la convocatoria.");
  }
});

// Eliminar jugador de la convocatoria
router.delete('/:match_id/convocatoria/:player_id', (req, res) => {
  const { match_id, player_id } = req.params;
  const query = `DELETE FROM convocatorias WHERE match_id = ? AND player_id = ?`;
  try {
    const stmt = req.teamDb.prepare(query);
    const result = stmt.run(match_id, player_id);

    if (result.changes === 0) {
      return res.status(404).send("Jugador no encontrado en la convocatoria.");
    }
    
    res.status(200).send("Jugador eliminado de la convocatoria.");
  } catch (err) {
    console.error("Error al eliminar el jugador de la convocatoria:", err.message);
    res.status(500).send("Error al eliminar el jugador de la convocatoria.");
  }
});


module.exports = router;
