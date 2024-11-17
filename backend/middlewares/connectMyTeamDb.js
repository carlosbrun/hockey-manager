const path = require('path');
const Database = require('better-sqlite3');
const mainDb = require('../database');

function connectMyTeamDb(req, res, next) {
   const myteam_id = req.myteam_id || req.cookies.myteam_id;
  
  if (!myteam_id) {
    return res.status(400).send("No se ha seleccionado un conjunto de equipos.");
  }

  try {
    // Busca el nombre de la base de datos en `main.db`
    const query = `SELECT db_name FROM myteams WHERE myteam_id = ?`;
    const row = mainDb.prepare(query).get(myteam_id); // Consulta síncrona para obtener `db_name`

    if (!row) {
      return res.status(500).send("Error al conectar con la base de datos del conjunto de equipos.");
    }

    const dbPath = path.join(__dirname, '../data', `${row.db_name}.db`);
    req.teamDb = new Database(dbPath);
    console.log(`Conectado a la base de datos: ${row.db_name}.db`);
    next();
  } catch (err) {
    console.error("Error al conectar con la base de datos del conjunto de equipos:", err.message);
    res.status(500).send("Error al conectar con la base de datos del conjunto de equipos.");
  }
}

module.exports = connectMyTeamDb;
