const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Vérification de la configuration JWT
if (!process.env.JWT_SECRET) {
  process.exit(1);
}

exports.login = async (req, res) => {
  try {
    if (!req.body || !req.body.username || !req.body.password) {
      return res.status(400).json({ 
        success: false,
        message: 'Nom d\'utilisateur et mot de passe requis' 
      });
    }
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Champs manquants');
      return res.status(400).json({ 
        success: false,
        message: 'Nom d\'utilisateur et mot de passe requis' 
      });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log('Admin non trouvé:', username);
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants invalides' 
      });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      console.log('Mot de passe incorrect pour:', username);
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants invalides' 
      });
    }

    const token = jwt.sign(
      { 
        id: admin._id, 
        role: 'admin',
        username: admin.username
      }, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: '24h',
        issuer: 'marketplace-api'
      }
    );

    console.log('Connexion réussie pour:', username);
    
    res.json({ 
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: 'admin'
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Champs requis manquants.' });
    }
    // Chercher l'admin par username
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(404).json({ error: 'Admin introuvable.' });
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Le mot de passe actuel est incorrect.' });
    }
    // Hash et sauvegarde le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();
    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe', details: err.message });
  }
};
