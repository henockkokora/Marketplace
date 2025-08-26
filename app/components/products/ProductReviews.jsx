'use client'

import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react'

export default function ProductReviews({ productId, reviews = [], productName = '' }) {
  const [activeTab, setActiveTab] = useState('reviews')
  
  // Utiliser les avis du produit ou un tableau vide si non défini
  const productReviews = reviews || []

  const renderStars = (rating) => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-[#F2994A] text-[#F2994A]' : 'text-[#DDD8B8]'}
        />
      )
    }
    return stars
  }

  const averageRating = productReviews.length > 0 
    ? productReviews.reduce((acc, review) => acc + review.rating, 0) / productReviews.length 
    : 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Avis clients</h2>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center mb-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-sm text-[#DDD8B8]">{productReviews.length} avis</div>
          </div>
        </div>
      </div>

      {/* Titre des avis */}
      <div className="mb-6 border-b pb-2">
        <h3 className="text-lg font-medium">Avis clients {productName && `sur ${productName}`} ({productReviews.length})</h3>
      </div>

      {/* Contenu des avis */}
      <div className="space-y-6">
        {productReviews.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun avis pour le moment. Soyez le premier à laisser un avis !</p>
        ) : (
          productReviews.map((review) => (
            <div key={review._id || review.id} className="border-b border-[#DDD8B8] pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#F2994A]1A rounded-full flex items-center justify-center">
                    <span className="font-semibold text-[#F2994A]">
                      {review.user.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center text-sm text-[#DDD8B8] mb-2">
                      <span className="font-medium text-gray-900">
                        {review.user?.name || `Utilisateur ${review.user?.substring(0, 6)}`}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{new Date(review.date || Date.now()).toLocaleDateString('fr-FR')}</span>
                      {review.verified && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-green-600">Achat vérifié</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-[#DDD8B8]">{new Date(review.date || Date.now()).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="font-semibold mb-2">{review.title}</h4>
              <p className="text-[#333] mt-2">{review.comment}</p>
              
              <div className="flex items-center space-x-4 text-sm">
                <button className="flex items-center space-x-1 text-gray-500 hover:text-[#6A7BA2]">
                  <ThumbsUp size={14} />
                  <span>Utile ({review.helpful})</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-500 hover:text-red-600">
                  <ThumbsDown size={14} />
                  <span>Pas utile</span>
                </button>
                <button className="text-sm text-[#F2994A] hover:underline">
                  Signaler cet avis
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}