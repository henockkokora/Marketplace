const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez entrer un email valide']
  },
  isActive: { type: Boolean, default: true },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date },
  source: { type: String, default: 'website' },
  metadata: {
    ipAddress: String,
    userAgent: String
  }
}, { timestamps: true });

// Index pour les recherches par email
newsletterSubscriberSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.models.NewsletterSubscriber || 
                 mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
