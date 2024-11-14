const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mainDb = require('../database');

function connectMyTeamDb(req, res, next) {
  const myteam_id = req.session.myteam_id; // Obtener el ID del conjunto de equipos de la sesión

  if (!myteam_id) {
    return res.status(400).send("No se ha seleccionado un conjunto de equipos.");
  }

  // Busca el nombre de la base de datos en `main.db`
  mainDb.get(`SELECT db_name FROM myteams WHERE myteam_id = ?`, [myteam_id], (err, row) => {
    if (err || !row) {
      return res.status(500).send("Error al conectar con la base de datos del conjunto de equipos.");
    }

    const dbPath = path.join(__dirname, '../data', `${row.db_name}.db`);
    req.teamDb = new sqlite3.Database(dbPath);
    console.log(`Conectado a la base de datos: ${row.db_name}.db`);
    next();
  });
}

module.exports = connectMyTeamDb;
