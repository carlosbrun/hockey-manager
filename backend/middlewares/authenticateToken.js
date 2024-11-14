const jwt = require('jsonwebtoken');

// Middleware para autenticar el token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).send("Acceso denegado. No se proporcionó un token.");

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Token inválido.");
    console.log("Token decodificado:", user); // Verifica el contenido del token
    req.user = user; // Guarda el usuario decodificado en req.user
    next();
  });
}

module.exports = authenticateToken;
