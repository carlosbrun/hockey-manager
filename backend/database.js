const sqlite3 = require('sqlite3').verbose();
const mainDb = new sqlite3.Database('./main.db');

mainDb.serialize(() => {
  // Tabla de usuarios para autenticación
  console.log("Creando tabla users...");
  mainDb.run(`
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
  mainDb.run(`
    CREATE TABLE IF NOT EXISTS myteams (
      myteam_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,                -- Nombre del conjunto, e.g., "benjamín"
      db_name TEXT NOT NULL UNIQUE,       -- Nombre de la base de datos, e.g., "benjamin.db"
      description TEXT
    )
  `);
  
  console.log("Tabla myteams creada.");

  console.log("Tablas en main.db creadas o ya existen.");
});

module.exports = mainDb;
