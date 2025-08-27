'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import StyledWrapper from './StyledWrapper';
import { getApiUrl, API_ENDPOINTS } from '../lib/config';

export default function CheckoutPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });
  const [promoError, setPromoError] = useState(null);
  const [loading, setLoading] = useState(true); // Commence en état de chargement
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  
  const { cart, clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    // Simuler un chargement initial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => {
      setIsMounted(false);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Vérifier le panier après le chargement initial
    if (!loading) {
      if (cart.length === 0) {
        setError('Votre panier est vide.');
      } else {
        setError(null);
      }
    }
  }, [cart, loading]);

  // Afficher un loader pendant le chargement initial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#F2994A]" />
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation des champs obligatoires
    const missingFields = [];
    Object.entries(formData).forEach(([key, value]) => {
      if (!value || value.trim() === '') missingFields.push(key);
    });
    if (missingFields.length > 0) {
      setError('Veuillez remplir tous les champs du formulaire.');
      setTouchedFields(prev => ({ ...prev, ...Object.fromEntries(missingFields.map(f => [f, true])) }));
      return;
    }
    // Validation stricte du numéro de téléphone Côte d'Ivoire (+225 suivi de 10 chiffres)
    if (!/^\+225\d{10}$/.test(formData.phone)) {
      setError('Le numéro de téléphone doit commencer par +225 et contenir exactement 10 chiffres après l’indicatif. Exemple : +2250700000000');
      setTouchedFields(prev => ({ ...prev, phone: true }));
      return;
    }
    setLoading(true);
    setError(null);
    if (cart.length === 0) {
      setError('Votre panier est vide. Veuillez ajouter des produits avant de procéder au paiement.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.ORDERS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientData: formData,
          cartItems: cart.map(item => ({
            productId: item.productId || item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image || (item.images && item.images[0]) || ''
          })),
          paymentMethod: 'stripe',
          clientTotal: Number(getTotalPrice()),
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If not JSON, probably HTML error
          throw new Error('Erreur serveur : la réponse n’est pas du JSON. Vérifiez l’API backend.');
        }
        throw new Error(errorData.error || errorData.message || 'Une erreur est survenue lors de la commande.');
      }

      let order;
      try {
        order = await response.json();
      } catch (e) {
        throw new Error('Erreur serveur : la réponse n’est pas du JSON. Vérifiez l’API backend.');
      }
      setSuccess(true);
      // Rediriger vers la page de confirmation
      setTimeout(() => {
        router.push(`/checkout/confirmation?orderId=${order._id || order.data?._id}`);
      }, 300);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#F2994A] mx-auto mb-4" />
          <p className="text-gray-600">Traitement de votre commande...</p>
        </div>
      </div>
    );
  }
  
  // Afficher un message si le panier est vide (sauf pendant le chargement)
  if (cart.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Votre panier est vide</h2>
          <p className="text-gray-600 mb-6">Ajoutez des produits à votre panier avant de procéder au paiement.</p>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#F2994A] hover:bg-[#e68a00]"
          >
            Voir les produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <StyledWrapper>
      <div className="container relative">
        {/* Bouton Retour */}
        <Link 
          href="/" 
          className="absolute left-4 top-4 flex items-center text-[#F2994A] hover:text-[#e68a00] transition-colors z-10"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          <span>Retour à l'accueil</span>
        </Link>
        
        <div className="card cart">
          <label className="title">FINALISER MA COMMANDE</label>
          <div className="steps">
            <div className="step">
              <div>
                <span>LIVRAISON</span>
                {error && (
                  <div className="flex items-center mb-4 p-3 rounded-lg bg-red-500 text-white animate-[pulse-fast_0.5s_ease-in-out_infinite]">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" /></svg>
                    <span>{error}</span>
                  </div>
                )}
                <form className="form" onSubmit={handleSubmit}>
                  <input type="text" name="name" placeholder="Nom complet" value={formData.name} onChange={handleChange} required className={`input_field${touchedFields.name && (!formData.name || formData.name.trim() === '') ? ' border-2 border-red-500 animate-[pulse-fast_0.5s_ease-in-out_infinite]' : ''}`} autoComplete="name" />
                  <input type="email" name="email" placeholder="Adresse e-mail" value={formData.email} onChange={handleChange} required className={`input_field${touchedFields.email && (!formData.email || formData.email.trim() === '') ? ' border-2 border-red-500 animate-[pulse-fast_0.5s_ease-in-out_infinite]' : ''}`} autoComplete="email" />
                  <input type="tel" name="phone" placeholder="Téléphone (ex: +2250700000000)" value={formData.phone} onChange={handleChange} required className={`input_field${touchedFields.phone && (!formData.phone || formData.phone.trim() === '') ? ' border-2 border-red-500 animate-[pulse-fast_0.5s_ease-in-out_infinite]' : ''}`} autoComplete="tel" pattern="\+225[0-9]{8,}" title="Le numéro doit commencer par +225" />
                  <input type="text" name="address" placeholder="Adresse de livraison" value={formData.address} onChange={handleChange} required className={`input_field${touchedFields.address && (!formData.address || formData.address.trim() === '') ? ' border-2 border-red-500 animate-[pulse-fast_0.5s_ease-in-out_infinite]' : ''}`} autoComplete="street-address" />
                  <input type="text" name="city" placeholder="Ville" value={formData.city} onChange={handleChange} required className={`input_field${touchedFields.city && (!formData.city || formData.city.trim() === '') ? ' border-2 border-red-500 animate-[pulse-fast_0.5s_ease-in-out_infinite]' : ''}`} autoComplete="address-level2" />
                </form>
              </div>
              <hr />
              <div>
                <span>MÉTHODE DE PAIEMENT</span>
<p>Espèce</p>
              </div>
              <hr />
              <div className="promo">
                <span>VOUS AVEZ UN CODE PROMO&nbsp;?</span>
                <form className="form" onSubmit={e => e.preventDefault()}>
  <input type="text" placeholder="Entrez un code promo" className="input_field" value={formData.promo || ''} onChange={e => setFormData({...formData, promo: e.target.value})} />
  <button type="button" onClick={() => setPromoError('Code promo invalide')}>Appliquer</button>
</form>
{promoError && (
  <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{promoError}</div>
)}
              </div>
              <hr />
              <div className="payments">
                <span>RÉCAPITULATIF</span>
<div className="details" style={{ display: 'block', marginBottom: 8 }}>
  {cart.length === 0 ? (
    <span style={{ fontStyle: 'italic', color: '#888' }}>Aucun produit dans le panier</span>
  ) : (
    cart.map((item, idx) => (
      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
        <span>{item.name} x{item.quantity}</span>
        <span>{(item.price * item.quantity).toLocaleString()} FRCFA</span>
      </div>
    ))
  )}
</div>
<div className="details">
  <span>Sous-total&nbsp;:</span>
  <span>{getTotalPrice()} FRCFA</span>
                </div>
              </div>
              <AnimatePresence>
  {error && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: '#fdecea',
        border: '1px solid #f5c6cb',
        color: '#a94442',
        borderRadius: 8,
        padding: '10px 16px',
        margin: '12px 0',
        fontSize: 14
      }}
    >
      <strong>Veuillez remplir les champs obligatoires :</strong>
      <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 18px' }}>
        {(() => {
          const requiredFields = [];
          if (typeof error === 'string') {
            const matches = error.match(/Path `([^`]+)` is required/gi);
            if (matches) {
              matches.forEach(m => {
                const field = m.match(/Path `([^`]+)` is required/)[1];
                let label = field;
                switch(field) {
                  case 'name': label = 'Nom complet'; break;
                  case 'email': label = 'Adresse e-mail'; break;
                  case 'phone': label = 'Téléphone'; break;
                  case 'address': label = 'Adresse'; break;
                  case 'city': label = 'Ville'; break;
                  default: label = field;
                }
                requiredFields.push(label);
              });
            }
          }
          return requiredFields.length > 0
            ? requiredFields.map((field, i) => <li key={i}>Le champ <b>{field}</b> est requis.</li>)
            : <li>{error}</li>;
        })()}
      </ul>
    </motion.div>
  )}
  {success && (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-green-600 text-sm flex items-center gap-2"
    >
      <CheckCircle size={18} /> Commande validée !
    </motion.p>
  )}
</AnimatePresence>
            </div>
          </div>
        </div>
        <div className="card checkout">
          <div className="footer">
            <label className="price">{getTotalPrice()} FRCFA</label>
<button className="checkout-btn" onClick={handleSubmit} disabled={loading}>
  {loading ? <Loader2 className="animate-spin inline-block mr-2" /> : 'Valider ma commande'}
</button>
          </div>
        </div>
      </div>


    </StyledWrapper>
  );
}