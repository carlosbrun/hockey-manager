const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const router = express.Router();
const mainDb = require('../database');
const authorizeRole = require('../middlewares/authorizeRole');

router.post('/select', (req, res) => {
  const { myteam_id } = req.body;
  
  if (!myteam_id) {
    return res.status(400).send("myteam_id es necesario para seleccionar el equipo.");
  }

  // Guarda el myteam_id en la sesión
  req.session.myteam_id = myteam_id;
  console.log(`Conjunto de equipos ${myteam_id} seleccionado`);

  res.status(200).send({ message: `Conjunto de equipos ${myteam_id} seleccionado` });
});

// Crear un nuevo conjunto de equipos con su propia base de datos
router.post('/create', authorizeRole('admin'), (req, res) => {
  console.log("Solicitud recibida en POST /myteams/create");
  const { name, db_name, description } = req.body;
  const dbPath = `./data/${db_name}.db`;

  // Verificar si la base de datos ya existe
  if (fs.existsSync(dbPath)) {
    return res.status(400).send("El nombre de la base de datos ya existe.");
  }

  // Insertar en la tabla myteams en main.db
  mainDb.run(
    `INSERT INTO myteams (name, db_name, description) VALUES (?, ?, ?)`,
    [name, db_name, description],
    function (err) {
      if (err) return res.status(500).send("Error al crear el conjunto de equipos en main.db");

      // Crear la base de datos del conjunto de equipos
      const teamDb = new sqlite3.Database(dbPath);
      teamDb.serialize(() => {
        // Crear las tablas en la base de datos de este conjunto
        console.log("Creando tabla teams...");
		teamDb.run(`
		  CREATE TABLE teams (
			team_id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			city TEXT,
			abbreviation TEXT UNIQUE,
			logo_path TEXT,
			phone TEXT,
			address TEXT,
			is_favorite BOOLEAN DEFAULT 0
		  )
		`, (err) => {
		  if (err) console.error("Error al crear tabla teams:", err.message);
		});

		console.log("Creando tabla players...");
		teamDb.run(`
		  CREATE TABLE players (
			player_id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			number INTEGER UNIQUE NOT NULL,
			photo_path TEXT,
			position TEXT,
			birthdate TEXT,
			team_id INTEGER,
			FOREIGN KEY (team_id) REFERENCES teams(team_id)
		  )
		`, (err) => {
		  if (err) console.error("Error al crear tabla players:", err.message);
		});

		console.log("Creando tabla matches...");
		teamDb.run(`
		  CREATE TABLE IF NOT EXISTS matches (
			match_id INTEGER PRIMARY KEY AUTOINCREMENT,
			team_1_id INTEGER,
			team_2_id INTEGER,
			date TEXT,
			location TEXT,
			score_team_1 INTEGER,
			score_team_2 INTEGER,
			round_number INTEGER, 
			details TEXT,
			FOREIGN KEY (team_1_id) REFERENCES teams(team_id),
			FOREIGN KEY (team_2_id) REFERENCES teams(team_id)
		  )
`);

		console.log("Creando tabla match_events...");
		teamDb.run(`
		  CREATE TABLE match_events (
			event_id INTEGER PRIMARY KEY AUTOINCREMENT,
			match_id INTEGER NOT NULL,
			player_id INTEGER NOT NULL,
			event_type TEXT,
			event_number INTEGER,
			FOREIGN KEY (match_id) REFERENCES matches(match_id),
			FOREIGN KEY (player_id) REFERENCES players(player_id)
		  )
		`, (err) => {
		  if (err) console.error("Error al crear tabla match_events:", err.message);
		});

		console.log("Creando tabla convocatorias...");
		teamDb.run(`
		  CREATE TABLE convocatorias (
			match_id INTEGER,
			player_id INTEGER,
			PRIMARY KEY (match_id, player_id),
			FOREIGN KEY (match_id) REFERENCES matches(match_id),
			FOREIGN KEY (player_id) REFERENCES players(player_id)
			);
		`, (err) => {
		  if (err) console.error("Error al crear tabla convocatorias:", err.message);
		});

        console.log(`Base de datos para el conjunto de equipos ${name} creada con éxito.`);
        res.status(201).send({ myteam_id: this.lastID, message: "Conjunto de equipos creado con éxito" });
      });
    }
  );
});

// Listar todos los conjuntos de equipos
router.get('/', (req, res) => {
  mainDb.all(`SELECT * FROM myteams`, [], (err, rows) => {
    if (err) return res.status(500).send("Error al listar los conjuntos de equipos.");
    res.status(200).json(rows);
  });
});

module.exports = router;
