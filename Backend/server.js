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
try {
  const envPath = path.resolve(__dirname, '.env');
  const result = dotenv.config({ path: envPath });
  
  if (result.error && process.env.NODE_ENV !== 'production') {
    console.warn('Mode développement: Fichier .env non trouvé ou erreur de chargement:', result.error);
  } else if (result.parsed) {
    console.log('Fichier .env chargé avec succès');
  }
} catch (error) {
  console.warn('Erreur lors du chargement du .env:', error.message);
  if (process.env.NODE_ENV === 'production') {
    console.error('Erreur critique en production, arrêt du serveur');
    process.exit(1);
  }
}

// Afficher les variables d'environnement chargées (sans les valeurs sensibles)
if (process.env.NODE_ENV !== 'production') {
  console.log('Configuration du serveur:', {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI ? '***' : 'non défini',
    JWT_SECRET: process.env.JWT_SECRET ? '***' : 'non défini',
    PORT: process.env.PORT || 4000,
    BASE_URL: process.env.BASE_URL || 'http://localhost:4000'
  });
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

// Configuration CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'https://marketplace-topaz-six.vercel.app',
  'https://marketplace-9l4q.onrender.com'
];

// URL de base pour les médias
const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL || 'http://localhost:4000';

const corsOptions = {
  origin: function (origin, callback) {
    // En développement, on autorise toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[CORS] Requête autorisée (développement) depuis: ${origin || 'sans origine'}`);
      return callback(null, true);
    }
    
    // Autoriser les requêtes sans origine (comme les requêtes côté serveur)
    if (!origin) {
      console.log('[CORS] Requête sans origine autorisée');
      return callback(null, true);
    }
    
    // Vérifier si l'origine est autorisée
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.endsWith('.vercel.app') ||
                     origin.endsWith('.onrender.com');
    
    if (isAllowed) {
      console.log(`[CORS] Origine autorisée: ${origin}`);
      return callback(null, true);
    }
    
    const msg = `L'origine ${origin} n'est pas autorisée par CORS`;
    console.warn(`[CORS] ${msg}`);
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200
};

// Configuration de base d'Express
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

// Configuration de la confiance du proxy (nécessaire pour les en-têtes X-Forwarded-*)
app.set('trust proxy', 1);

// Middleware CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pré-requêtes OPTIONS

// Middleware pour compresser les réponses
app.use(compression());

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Désactivation temporaire de l'optimisation d'images
// app.use('/uploads', imageOptimizer());

// Middleware de journalisation (désactivé en production)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
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

  // Configuration des fichiers statiques avec gestion des erreurs
  const staticOptions = {
    etag: true,
    lastModified: true,
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, path) => {
      // Désactiver le cache en développement
      if (process.env.NODE_ENV === 'development') {
        res.set('Cache-Control', 'no-store');
      } else {
        // Mettre en cache pendant 1 an en production
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      
      // Définir le type MIME approprié en fonction de l'extension du fichier
      const ext = path.split('.').pop().toLowerCase();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
      };
      
      if (mimeTypes[ext]) {
        res.set('Content-Type', mimeTypes[ext]);
      }
    }
  };

  // Middleware pour servir les fichiers statiques avec gestion d'erreurs
  const serveStatic = express.static(baseUploadsDir, {
    ...staticOptions,
    fallthrough: false // Empêche le passage au middleware suivant si le fichier n'est pas trouvé
  });

  // Route pour les fichiers statiques
  app.use('/uploads', (req, res, next) => {
    // Log pour le débogage
    console.log(`[Static Files] Tentative d'accès à: ${req.path}`);
    
    // Vérifier si le fichier existe avant de le servir
    const filePath = path.join(baseUploadsDir, req.path);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`[Static Files] Fichier non trouvé: ${filePath}`);
        return res.status(404).json({
          success: false,
          error: 'Fichier non trouvé',
          path: req.path
        });
      }
      
      // Si le fichier existe, le servir avec express.static
      serveStatic(req, res, (err) => {
        if (err) {
          console.error('[Static Files] Erreur lors du chargement du fichier:', {
            path: req.path,
            error: err.message,
            stack: err.stack
          });
          
          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              error: 'Erreur lors du chargement du fichier',
              path: req.path
            });
          }
        }
        next();
      });
    });
  });
  
  // Route de débogage pour vérifier l'accès aux fichiers
  app.get('/debug/uploads/*', (req, res) => {
    const filePath = path.join(baseUploadsDir, req.params[0]);
    console.log('[Debug] Vérification du fichier:', filePath);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({
          exists: false,
          path: filePath,
          error: err.message
        });
      }
      
      const stats = fs.statSync(filePath);
      res.json({
        exists: true,
        path: filePath,
        isFile: stats.isFile(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    });
  });

  // Route de débogage pour vérifier l'accès aux fichiers
  app.get('/debug/uploads/*', (req, res) => {
    const filePath = path.join(baseUploadsDir, req.params[0]);
    console.log('Tentative d\'accès au fichier:', filePath);
    console.log('Le fichier existe:', fs.existsSync(filePath));
    res.json({
      path: filePath,
      exists: fs.existsSync(filePath),
      isFile: fs.existsSync(filePath) ? fs.statSync(filePath).isFile() : false
    });
  });
};

// Initialisation des fichiers statiques
setupStaticFiles();

// Configuration des routes API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRouter);
app.use('/api/categories/:categoryId/subcategories', subcategoriesRouter);
app.use('/api/subcategories', subcategoriesRouter);
app.use('/api/categories/:categoryId/subcategories/:subcategoryId/subsubcategories', subsubcategoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/newsletter', newsletterRouter);

// Route de test
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé',
    path: req.originalUrl
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue sur le serveur' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
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
