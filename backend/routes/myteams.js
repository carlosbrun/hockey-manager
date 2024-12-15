const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const mainDb = require('../database');
const authorizeRole = require('../middlewares/authorizeRole');
const jwt = require('jsonwebtoken');

router.post('/select', (req, res) => {
	const { myteam_id } = req.body;

	if (!myteam_id) {
		return res.status(400).send("myteam_id es necesario para seleccionar el equipo.");
	}

	// Decodificar el token actual del usuario para obtener sus datos
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).send("No se proporcionó un token.");
	}

	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send("Token inválido.");
    }

    // Agregar myteam_id al payload del token
    const newPayload = { user_id: user.user_id, role: user.role, myteam_id: myteam_id, exp: Math.floor(Date.now() / 1000) + 3600 }; // Expira en 1 hora

    // Generar un nuevo token con el valor actualizado
    const newToken = jwt.sign(newPayload, process.env.JWT_SECRET); 

    res.status(200).send({
      token: newToken,
      message: `Conjunto de equipos ${myteam_id} seleccionado.`,
    });
  });
});

// Crear un nuevo conjunto de equipos con su propia base de datos
router.post('/create', authorizeRole('admin'), (req, res) => {
  console.log("Solicitud recibida en POST /myteams/create");
  const { name, db_name, description } = req.body;
  const dbPath = path.join(__dirname, '../data', `${db_name}.db`);

  if (fs.existsSync(dbPath)) {
    return res.status(400).send("El nombre de la base de datos ya existe.");
  }

  // Insertar en la tabla myteams en main.db
  try {
    const insertStmt = mainDb.prepare(`INSERT INTO myteams (name, db_name, description) VALUES (?, ?, ?)`);
    const info = insertStmt.run(name, db_name, description);

    // Crear la base de datos del conjunto de equipos
    const teamDb = new Database(dbPath);

    // Crear las tablas en la base de datos de este conjunto
    teamDb.exec(`
      CREATE TABLE teams (
        team_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        city TEXT,
        abbreviation TEXT UNIQUE,
        logo_path TEXT,
        phone TEXT,
        address TEXT,
        is_favorite BOOLEAN DEFAULT 0
      );
      
      CREATE TABLE players (
        player_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        number INTEGER UNIQUE NOT NULL,
        photo_path TEXT,
        position TEXT,
        birthdate TEXT,
        team_id INTEGER,
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
      );
      
      CREATE TABLE matches (
        match_id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_1_id INTEGER,
        team_2_id INTEGER,
        date TEXT,
        location TEXT,
        score_team_1 INTEGER,
        score_team_2 INTEGER,
        round_number INTEGER, 
        details TEXT,
        instagram_post TEXT,
        FOREIGN KEY (team_1_id) REFERENCES teams(team_id),
        FOREIGN KEY (team_2_id) REFERENCES teams(team_id)
      );
      
      CREATE TABLE match_events (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        event_type TEXT,
        event_number INTEGER,
        FOREIGN KEY (match_id) REFERENCES matches(match_id),
        FOREIGN KEY (player_id) REFERENCES players(player_id)
      );
      
      CREATE TABLE convocatorias (
        match_id INTEGER,
        player_id INTEGER,
        PRIMARY KEY (match_id, player_id),
        FOREIGN KEY (match_id) REFERENCES matches(match_id),
        FOREIGN KEY (player_id) REFERENCES players(player_id)
      );
    `);

    console.log(`Base de datos para el conjunto de equipos ${name} creada con éxito.`);
    res.status(201).send({ myteam_id: info.lastInsertRowid, message: "Conjunto de equipos creado con éxito" });
  } catch (err) {
    console.error("Error al crear el conjunto de equipos en main.db o al crear la base de datos:", err.message);
    res.status(500).send("Error al crear el conjunto de equipos en main.db");
  }
});

// Listar todos los conjuntos de equipos
router.get('/', (req, res) => {
  try {
    const rows = mainDb.prepare(`SELECT * FROM myteams`).all();
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al listar los conjuntos de equipos:", err.message);
    res.status(500).send("Error al listar los conjuntos de equipos.");
  }
});

module.exports = router;
