import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS } from '../../lib/config';

export default function SimilarProducts({ category, currentId }) {
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (category && category._id) {
        try {
          const res = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}/category/${category._id}`));
          if (res.ok) {
            let products = await res.json();
            // Filter out the current product and limit to 4
            products = products.filter(p => p._id !== currentId).slice(0, 4);
            setSimilarProducts(products);
          }
        } catch (error) {
          console.error('Failed to fetch similar products:', error);
        }
      }
    };

    fetchSimilarProducts();
  }, [category, currentId]);

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={i < fullStars ? 'fill-[#F2994A] text-[#F2994A]' : 'text-[#DDD8B8]'}
        />
      )
    }
    return stars
  }

  if (similarProducts.length === 0) {
    return null; // Don't render anything if there are no similar products
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold mb-6 text-[#333]">Produits similaires</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {similarProducts.map((product) => (
          <Link 
            key={product._id} 
            href={`/products/${product._id}`}
            className="group block"
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <h4 className="font-medium text-[#333] group-hover:text-[#F2994A] transition-colors">{product.name}</h4>
            <div className="flex items-center mt-1">
              {renderStars(product.averageRating || 0)}
              <span className="text-sm text-[#DDD8B8] ml-1">({product.reviews ? product.reviews.length : 0})</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="font-bold text-[#F2994A]">{product.promoPrice || product.price} F CFA</span>
              {product.promoPrice && (
                <span className="text-sm text-[#DDD8B8] line-through ml-2">{product.price} F CFA</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}