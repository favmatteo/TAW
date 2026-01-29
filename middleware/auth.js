const jwt = require('jsonwebtoken');

// Middleware per autenticare le richieste
const auth = (req, res, next) => {
    if (!req.headers['authorization']) {
        return res.status(401).json({
            message: "Missing Authorization header"
        });
    }

    const token = req.headers['authorization'].split(' ')[1];
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.id = decode.id;
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token",
            error: error && error.message
        });
    }
}

module.exports = auth;