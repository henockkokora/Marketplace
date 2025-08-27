'use client'

import { useState, useEffect } from 'react'
import { getApiUrl, API_ENDPOINTS } from '../../lib/config';
import Link from 'next/link';

export default function SpecialOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(getApiUrl(API_ENDPOINTS.PRODUCTS + '/admin/all'));
        if (!res.ok) throw new Error('Erreur lors du chargement des offres spéciales');
        const data = await res.json();
        setOffers(data.filter(p => p.isSpecialOffer));
      } catch (err) {
        setError(err.message || 'Erreur réseau');
      }
      setLoading(false);
    }
    fetchOffers();
  }, []);

  return (
    <section className="py-12 bg-gradient-to-b from-red-100 to-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center items-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-red-700 py-2 px-4">Offres Spéciales</h2>
        </div>
        {loading ? (
          <div className="text-center py-12 text-lg">Chargement des offres...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : offers.length === 0 ? (
          <div className="text-center text-gray-600 py-12 text-xl">Aucune offre spéciale disponible pour le moment.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {offers.map(product => (
              <div key={product._id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all flex flex-col">
                <div className="relative h-56 bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={product.images?.[0] || 'https://placehold.co/400x300?text=No+Image'}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                  {product.specialOfferPrice && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">{product.specialOfferPrice.toLocaleString()} FCFA</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col p-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                  <div className="flex-1 text-gray-600 mb-3 line-clamp-3">{product.description}</div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg font-semibold text-red-700">{product.specialOfferPrice ? product.specialOfferPrice.toLocaleString() : product.price.toLocaleString()} FCFA</span>
                    {product.specialOfferPrice && (
                      <span className="text-xs text-gray-400 line-through">{product.price.toLocaleString()} FCFA</span>
                    )}
                  </div>
                  <Link href={`/products/${product._id}`} className="mt-auto inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition">Voir le produit</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}