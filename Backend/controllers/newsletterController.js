const NewsletterSubscriber = require('../models/NewsletterSubscriber');

// S'abonner à la newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email est requis' });
    }

    // Vérifier si l'email est déjà inscrit
    const existingSubscriber = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
    
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        // Ne pas envoyer d'email, juste notifier côté frontend
        return res.status(200).json({ 
          success: true, 
          message: 'Vous êtes déjà inscrit à notre newsletter',
          isNew: false
        });
      } else {
        // Réactiver l'abonnement existant
        existingSubscriber.isActive = true;
        existingSubscriber.unsubscribedAt = null;
        await existingSubscriber.save();
        return res.status(200).json({ 
          success: true, 
          message: 'Merci pour votre réinscription à notre newsletter !',
          isNew: false
        });
      }
    }

    // Créer un nouvel abonné
    const newSubscriber = new NewsletterSubscriber({
      email: email.toLowerCase(),
      source: req.headers.referer || 'website',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    await newSubscriber.save();

    // Envoi d'un email de confirmation avec Nodemailer
    try {
      const transporter = require('../utils/mailer');
      await transporter.sendMail({
        from: '"ECEFA Newsletter" <no-reply@ecefa.com>',
        to: email,
        subject: 'Bienvenue à la newsletter ECEFA !',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;background:#fff;border-radius:10px;padding:24px 18px 20px 18px;text-align:center;">
          <h2 style="color:#404E7C;margin-bottom:12px;">Bienvenue sur ECEFA !</h2>
          <p>Merci de vous être inscrit à notre newsletter.<br>Vous recevrez désormais nos actualités et offres exclusives.</p>
          <hr style="margin:22px 0 14px 0;border:none;border-top:1px solid #eee;" />
          <div style="font-size:13px;color:#888;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</div>
        </div>`
      });
    } catch (mailErr) {
      console.error('Erreur lors de l\'envoi de l\'email newsletter:', mailErr);
      // On n'empêche pas l'inscription même si le mail échoue
    }

    res.status(201).json({ 
      success: true, 
      message: 'Merci pour votre inscription à notre newsletter !',
      isNew: true
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription à la newsletter:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Une erreur est survenue lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir tous les abonnés (pour l'admin)
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find({ isActive: true })
      .sort({ subscribedAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      data: subscribers,
      count: subscribers.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnés:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des abonnés',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Exporter les abonnés au format CSV
exports.exportSubscribers = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find({ isActive: true })
      .sort({ subscribedAt: -1 });
    
    // Créer le contenu CSV
    let csvContent = 'Email,Date d\'inscription,Source\n';
    
    subscribers.forEach(subscriber => {
      const row = [
        `"${subscriber.email}"`,
        subscriber.subscribedAt.toISOString(),
        `"${subscriber.source || 'website'}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    // Envoyer le fichier CSV
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=abonnes-newsletter.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Erreur lors de l\'export des abonnés:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'export des abonnés',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
