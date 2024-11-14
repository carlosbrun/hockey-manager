const express = require('express');
const connectMyTeamDb = require('../middlewares/connectMyTeamDb');
const authorizeRole = require('../middlewares/authorizeRole');
const sharp = require('sharp');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const fs = require('fs');

router.use(connectMyTeamDb); // Aplica el middleware para conectar con la base de datos activa

// Configuración de almacenamiento de logos de equipos
const storage = multer.memoryStorage(); // Almacenamiento en memoria para procesamiento
const upload = multer({ storage: storage });

// Crear un equipo con logo, teléfono y dirección
router.post('/', authorizeRole('admin'), upload.single('logo'), (req, res) => {
  const { name, city, abbreviation, phone, address, is_favorite } = req.body;
  const logoPath = req.file ? req.file.path : null;

  req.teamDb.run(
    `INSERT INTO teams (name, city, abbreviation, logo_path, phone, address, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, city, abbreviation, logoPath, phone, address, is_favorite],
    function (err) {
      if (err) {
        res.status(400).send("Error al crear el equipo.");
      } else {
        res.status(201).send({ team_id: this.lastID });
      }
    }
  );
});

// Obtener todos los equipos
router.get('/', (req, res) => {
  req.teamDb.all(`SELECT * FROM teams ORDER BY is_favorite DESC, name ASC`, [], (err, rows) => {
    if (err) {
      res.status(400).send("Error al obtener los equipos.");
    } else {
      res.status(200).json(rows);
    }
  });
});

// Obtener equipo favorito
router.get('/favorite', (req, res) => {
  const query = `SELECT * FROM teams WHERE is_favorite = 1`;

  req.teamDb.get(query, [], (err, row) => {
    if (err) {
      console.error("Error al obtener el equipo favorito:", err.message);
      return res.status(500).send("Error al obtener el equipo favorito.");
    }

    if (!row) {
      return res.status(404).send("No se ha seleccionado un equipo favorito.");
    }

    res.status(200).json(row);
  });
});

// Obtener un equipo por ID
router.get('/:id', (req, res) => {
  const teamId = req.params.id;

  req.teamDb.get(`SELECT * FROM teams WHERE team_id = ?`, [teamId], (err, row) => {
    if (err) {
      res.status(400).send("Error al obtener el equipo.");
    } else if (!row) {
      res.status(404).send("Equipo no encontrado.");
    } else {
      res.status(200).json(row);
    }
  });
});

// Actualizar un equipo (incluyendo logo, teléfono y dirección)
router.put('/:id', authorizeRole('admin'), upload.single('logo'), async (req, res) => {
  const teamId = req.params.id;
  const { name, city, abbreviation, phone, address, is_favorite } = req.body;

  let photoPath = null;
  
  if (req.file) {
    const photoFileName = `${teamId}.png`;
    photoPath = path.join(__dirname, '../uploads/badges/', photoFileName);

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
  
  const query = photoPath
    ? `UPDATE teams SET name = ?, city = ?, abbreviation = ?, logo_path = ?, phone = ?, address = ?, is_favorite = ? WHERE team_id = ?`
    : `UPDATE teams SET name = ?, city = ?, abbreviation = ?, phone = ?, address = ?, is_favorite = ? WHERE team_id = ?`;
  const params = photoPath
    ? [name, city, abbreviation, `/uploads/badges/${teamId}.png`, phone, address, is_favorite, teamId]
    : [name, city, abbreviation, phone, address, is_favorite, teamId];

  req.teamDb.run(query, params, function (err) {
    if (err) {
      res.status(400).send("Error al actualizar el equipo.");
    } else if (this.changes === 0) {
      res.status(404).send("Equipo no encontrado.");
    } else {
      res.status(200).send("Equipo actualizado con éxito.");
    }
  });
});

// Eliminar un equipo
router.delete('/:id', authorizeRole('admin'), (req, res) => {
  const teamId = req.params.id;

  req.teamDb.run(`DELETE FROM teams WHERE team_id = ?`, [teamId], function (err) {
    if (err) {
      res.status(400).send("Error al eliminar el equipo.");
    } else if (this.changes === 0) {
      res.status(404).send("Equipo no encontrado.");
    } else {
      res.status(200).send("Equipo eliminado con éxito.");
    }
  });
});

module.exports = router;
