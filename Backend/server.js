// Chargement des dépendances principales
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const fs = require('fs-extra');
const compression = require('compression');
const { imageOptimizer } = require('./utils/imageOptimizer');

// Configuration des variables d'environnement
if (process.env.NODE_ENV !== 'production') {
  try {
    const envPath = path.resolve(__dirname, '.env');
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.warn('Mode développement: Fichier .env non trouvé. Vérifiez les variables d\'environnement.');
    } else {
      console.log('Fichier .env chargé avec succès');
    }
  } catch (error) {
    console.warn('Mode développement: Erreur lors du chargement du .env:', error.message);
  }
}

// Vérification des variables d'environnement requises
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  const errorMsg = `ERREUR: Variables d'environnement manquantes: ${missingVars.join(', ')}`;
  console.error(errorMsg);
  
  // En production, on arrête le serveur si les variables critiques manquent
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  
  // En développement, on affiche un avertissement mais on continue
  console.warn('Mode développement: Le serveur démarre malgré les variables manquantes.');
}

// Routes
const authRoutes = require('./routes/authRoutes');
const Admin = require('./models/Admin');
const categoriesRouter = require('./routes/categories');
const subcategoriesRouter = require('./routes/subcategories');
const subsubcategoriesRouter = require('./routes/subsubcategories');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const analyticsRouter = require('./routes/analytics');
const newsletterRouter = require('./routes/newsletterRoutes');

const app = express();

// Gestion des erreurs non attrapées
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    // En développement, on autorise toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // En production, on vérifie l'origine
    const allowedOrigins = [
      'https://votre-frontend.vercel.app',
      // Ajoutez d'autres domaines de production ici
    ];

    // Autoriser les requêtes sans origine (applications mobiles, Postman, etc.)
    // En production, il est recommandé de restreindre cela
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Tentative de connexion depuis une origine non autorisée:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Content-Length', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Auth-Token'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 heures
};

// Middleware CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

// Middleware pour compresser les réponses
app.use(compression());

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));

// Middleware pour optimiser les images
app.use('/uploads', imageOptimizer());

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware de journalisation (désactivé en production)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    next();
  });
}

// Configuration des fichiers statiques
const setupStaticFiles = () => {
  const baseUploadsDir = path.join(process.cwd(), 'uploads');
  
  // Créer les sous-dossiers nécessaires
  const subDirs = ['', 'products', 'categories', 'optimized'];
  subDirs.forEach(subDir => {
    const fullPath = path.join(baseUploadsDir, subDir);
    try {
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`Dossier créé: ${fullPath}`);
      }
    } catch (err) {
      console.error(`Erreur création dossier ${fullPath}:`, err);
    }
  });

  // Middleware pour servir les fichiers statiques
  app.use('/uploads', (req, res, next) => {
    // Ignorer les requêtes sans extension de fichier
    if (!path.extname(req.path)) {
      return next();
    }
    
    // Désactiver le cache en développement
    if (process.env.NODE_ENV === 'development') {
      res.set('Cache-Control', 'no-store');
    } else {
      // Mettre en cache pendant 1 an en production
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    next();
  }, express.static(baseUploadsDir, {
    etag: true,
    lastModified: true,
    maxAge: '1y',
    immutable: true
  }));
};

// Initialisation des fichiers statiques
setupStaticFiles();

// if (process.env.NODE_ENV === 'development') {
//   app.use((req, res, next) => {
//     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//     next();
//   });
// }

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRouter);
app.use('/api/categories/:categoryId/subcategories', subcategoriesRouter);
app.use('/api/subcategories', subcategoriesRouter); // Nouvelle route pour toutes les sous-catégories
app.use('/api/categories/:categoryId/subcategories/:subcategoryId/subsubcategories', subsubcategoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/newsletter', newsletterRouter);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ 
    error: 'Une erreur est survenue sur le serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Fonction pour créer un admin par défaut
async function createAdminIfNotExists() {
  try {
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin existe déjà');
      return;
    }

    const hashedPassword = await bcrypt.hash('ecefa2025', 10);
    const admin = new Admin({
      username: 'admin',
      password: hashedPassword,
    });

    await admin.save();
    console.log('Admin créé avec succès');
  } catch (err) {
    console.error('Erreur création admin:', err);
    throw err;
  }
}

// Gestion de la fermeture propre
const shutdown = async () => {
  console.log('Fermeture du serveur...');
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Connexion à MongoDB et démarrage du serveur
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ MongoDB connecté');
    await createAdminIfNotExists();
    
    const PORT = process.env.PORT || 4000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé`);
      } else {
        console.error('❌ Erreur du serveur:', err);
      }
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ Erreur de démarrage du serveur:', err);
    process.exit(1);
  }
};

startServer();
