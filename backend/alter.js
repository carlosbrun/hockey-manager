const Database = require('better-sqlite3');

// Conecta a la base de datos
const db = new Database('./main.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
    return;
  }
  console.log('Conectado a la base de datos.');
});

// Ejecuta la sentencia ALTER TABLE
db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'viewer';`, (err) => {
  if (err) {
    console.error("Error al agregar la columna 'role':", err.message);
  } else {
    console.log("Columna 'role' agregada con éxito.");
  }
});

// Cierra la conexión
db.close((err) => {
  if (err) {
    console.error('Error al cerrar la conexión a la base de datos:', err.message);
  }
  console.log('Conexión cerrada.');
});
