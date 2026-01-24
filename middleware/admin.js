const passengerModel = require('../models/passenger');

const isAdmin = async (req, res, next) => {
    try {
       if (!req.id) {
           return res.status(401).json({ message: "Unauthorized" });
       }
       const user = await passengerModel.findById(req.id);
        if (!user) {
             const tokenEmail = req.user && req.user.email;
             if (tokenEmail === 'admin@admin.com') {
                 console.log('[admin] allowed by token email fallback');
                 return next();
             }
             return res.status(404).json({ message: "User not found" });
        }

        console.log('[admin] user email:', user.email);
        if (user.email === 'admin@admin.com') {
            next();
        } else {
            return res.status(403).json({ message: "Forbidden: Admin access required" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = isAdmin;
