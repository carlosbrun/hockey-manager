const jwt = require('jsonwebtoken');

// Middleware para autorizar usuarios según el rol
function authorizeRole(requiredRole) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send("Acceso denegado. No se proporcionó un token.");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== requiredRole) {
        return res.status(403).send("Acceso denegado. No tiene permisos para esta acción.");
      }
      req.user = decoded; // Guarda los datos del usuario en la solicitud
      next();
    } catch (err) {
      res.status(401).send("Token inválido.");
    }
  };
}

module.exports = authorizeRole;
