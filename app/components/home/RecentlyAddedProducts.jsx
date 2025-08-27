import Link from 'next/link'
import { Star, ShoppingCart, ChevronRight, Trash2, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { useCart } from '../../context/CartContext'
import { getMediaUrl, getFallbackImage } from '@/app/lib/media';

export default function RecentlyAddedProducts({ products }) {
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
  

  
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating || 0)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} className="fill-yellow-400 text-yellow-400" />)
    }

    const remainingStars = 5 - Math.ceil(rating || 0)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-gray-300" />)
    }

    return stars
  }

  // Vérifier si un produit est considéré comme nouveau (moins d'un mois)
  const isProductNew = (createdAt) => {
    if (!createdAt) return false;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return new Date(createdAt) > oneMonthAgo;
  };

  // Trier les produits par date de création (les plus récents d'abord) et prendre les 8 premiers
  const recentlyAdded = [...products]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 8);

  if (recentlyAdded.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-white bg-red-600 mb-6 py-2 rounded-lg shadow text-center">Produits récemment ajoutés</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {recentlyAdded.map((product) => (
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
{isProductNew(product.createdAt) && (
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded-full bg-blue-500 text-white shadow-md">
                      Nouveau
                    </span>
                  )}
                  
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
                    
                    {/* Affichage des prix avec style promo */}
                    <div className="mt-auto">
                      {product.promoPrice && product.promoPrice < product.price ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[#F2994A] font-bold text-xl">
                              {product.promoPrice?.toLocaleString()} FCFA
                            </span>
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              -{Math.round((1 - product.promoPrice / product.price) * 100)}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 line-through">
                            {product.price?.toLocaleString()} FCFA
                          </div>
                        </div>
                      ) : (
                        <div className="text-[#F2994A] font-bold text-xl">
                          {product.price?.toLocaleString()} FCFA
                        </div>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
