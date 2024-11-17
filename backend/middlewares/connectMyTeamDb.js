const path = require('path');
const Database = require('better-sqlite3');
const mainDb = require('../database');
const jwt = require('jsonwebtoken');

function connectMyTeamDb(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send("Token no proporcionado.");
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send("Token inválido.");
    }

    const myteam_id = decoded.myteam_id;

    if (!myteam_id) {
      return res.status(400).send("No se ha seleccionado un conjunto de equipos.");
    }

    try {
      const query = `SELECT db_name FROM myteams WHERE myteam_id = ?`;
      const row = mainDb.prepare(query).get(myteam_id);

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
  });
}

module.exports = connectMyTeamDb;
