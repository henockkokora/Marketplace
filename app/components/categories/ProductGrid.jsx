import Link from 'next/link'
import { Star, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { toast } from 'react-toastify'
import { getMediaUrl, getFallbackImage } from '@/app/lib/media'

export default function ProductGrid({ products = [] }) {
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          className={i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      )
    }
    return stars
  }

  const { addToCart, removeFromCart, cart } = useCart();
  
  // Vérifie si un produit est dans le panier
  const isInCart = (productId) => {
    return cart.some(item => item.id === productId);
  };
  
  // Gère le clic sur le bouton d'ajout/retrait
  const handleCartAction = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInCart(product._id)) {
      // Si le produit est déjà dans le panier, on le retire
      removeFromCart(product._id);
      toast.success('Produit retiré du panier', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      // Sinon on l'ajoute
      addToCart({
        id: product._id,
        name: product.name,
        price: product.promoPrice || product.price,
        image: product.images?.[0],
        quantity: 1
      });
      toast.success('Produit ajouté au panier', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  if (!Array.isArray(products)) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erreur de chargement des produits</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucun produit trouvé dans cette catégorie</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">{products.length} produits trouvés</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product._id} className="group">
            <div className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
              {/* Image container */}
              <div className="relative w-full h-0 pb-[100%] bg-gray-50 overflow-hidden">
                <Link href={`/products/${product._id}`} className="block w-full h-full">
                  <img
                    src={product.images?.[0] ? getMediaUrl(product.images[0]) : getFallbackImage()}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/200x200?text=Image+Not+Found';
                    }}
                  />
                </Link>
                {/* Badge Nouveau retiré */}
                
                {/* Bouton d'ajout au panier avec effet de survol */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button 
                    onClick={(e) => handleCartAction(e, product)}
                    className={`${isInCart(product._id) ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-[#F2994A] hover:bg-[#F2994A] hover:text-white'} rounded-full px-4 py-2 shadow-lg flex items-center justify-center transform transition-all duration-300 hover:scale-105`}
                    title={isInCart(product._id) ? 'Retirer du panier' : 'Ajouter au panier'}
                  >
                    {isInCart(product._id) ? (
                      <Trash2 size={16} className="mr-2" />
                    ) : (
                      <ShoppingCart size={16} className="mr-2" />
                    )}
                    <span className="font-medium">{isInCart(product._id) ? 'Retirer' : 'Ajouter'}</span>
                  </button>
                </div>
              </div>

              {/* Product info */}
              <div className="p-4 flex-1 flex flex-col text-center">
                <Link href={`/products/${product._id}`} className="flex-1 flex flex-col">
                  <h3 className="text-base text-gray-800 font-medium mb-2 line-clamp-2 hover:text-[#F2994A] transition-colors">
                    {product.name}
                  </h3>
                  
                  {/* Affichage simplifié des prix */}
                  <div className="mt-2">
                    {product.promoPrice && product.promoPrice < product.price ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[#F2994A] font-bold text-lg">
                          {Math.round(product.promoPrice).toLocaleString()} FCFA
                        </span>
                        <span className="text-gray-400 text-sm line-through">
                          {Math.round(product.price).toLocaleString()} FCFA
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#F2994A] font-bold text-lg">
                        {Math.round(product.price).toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                  
                  {/* Stock status */}
                  <div className="text-sm mt-2">
                    {product.stock > 10 ? (
                      <span className="text-green-600">En stock</span>
                    ) : product.stock > 0 ? (
                      <span className="text-[#F2994A]">Plus que {product.stock} en stock</span>
                    ) : (
                      <span className="text-red-500">Rupture de stock</span>
                    )}
                  </div>
                </Link>
                
                {/* Rating */}
                <div className="flex items-center justify-center mt-2">
                  {renderStars(product.averageRating)}
                  <span className="text-xs text-gray-500 ml-1">({product.reviewCount || 0})</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <div className="flex space-x-2">
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-[#F2994A] transition-colors">
            Précédent
          </button>
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              className={`px-3 py-2 border rounded-lg transition-colors ${
                page === 1
                  ? 'bg-[#F2994A] text-white border-[#F2994A]'
                  : 'border-gray-300 hover:bg-[#F2994A] hover:text-white'}`}
            >
              {page}
            </button>
          ))}
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-[#F2994A] hover:text-white transition-colors">
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}