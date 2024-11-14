// database.js
const Database = require('better-sqlite3');

// Crea una conexión a la base de datos usando better-sqlite3
const mainDb = new Database('./main.db', { verbose: console.log });

  // Tabla de usuarios para autenticación
  console.log("Creando tabla users...");
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT NOT NULL,
	  role TEXT NOT NULL DEFAULT 'viewer'  -- Valores ('viewer','admin')
    )
  `);
  
  console.log("Tabla users creada.");

  // Tabla para los conjuntos de datos de equipos propios del usuario
  console.log("Creando tabla myteams...");
  mainDb.exec(`
    CREATE TABLE IF NOT EXISTS myteams (
      myteam_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,                -- Nombre del conjunto, e.g., "benjamín"
      db_name TEXT NOT NULL UNIQUE,       -- Nombre de la base de datos, e.g., "benjamin.db"
      description TEXT
    )
  `);
  
  console.log("Tabla myteams creada.");

  console.log("Tablas en main.db creadas o ya existen.");

module.exports = mainDb;
