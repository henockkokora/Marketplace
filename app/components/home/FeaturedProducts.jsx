import Link from 'next/link'
import { Star, ShoppingCart, ChevronRight, Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { useCart } from '../../context/CartContext'
import { useState, useEffect } from 'react'

// Vérifie si un produit est considéré comme "Nouveau" (ajouté il y a moins d'un mois)
const isProductNew = (createdAt) => {
  if (!createdAt) return false;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return new Date(createdAt) > oneMonthAgo;
};

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return 'https://placehold.co/200x200?text=No+Image';
  if (imagePath.startsWith('http')) return imagePath;
  
  // Nettoyer les backslashes et les doublons de /uploads/
  let cleanPath = imagePath.replace(/\\/g, '/');
  cleanPath = cleanPath.replace(/([^:]\/)\/+/g, '$1');
  
  // Ajouter le préfixe /uploads/ si nécessaire
  if (!cleanPath.startsWith('/uploads/') && !cleanPath.startsWith('http')) {
    cleanPath = `/uploads/${cleanPath}`;
  }
  
  // Ajouter le préfixe de l'URL du backend
  return `http://localhost:4000${cleanPath}`;
};

export default function FeaturedProducts() {
  const { addToCart, removeFromCart, cart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMostOrderedProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:4000/api/products/most-ordered');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des produits en vedette');
        }
        
        const data = await response.json();
        
        // Si aucun produit n'est retourné, on laisse le tableau vide
        setFeaturedProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMostOrderedProducts();
  }, []);

  // Ne pas afficher la section si aucun produit n'est disponible
  if (!loading && featuredProducts.length === 0) {
    return null;
  }
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" size={16} className="fill-yellow-400 text-yellow-400" />)
    }

    const remainingStars = 5 - Math.ceil(rating)
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-gray-300" />)
    }

    return stars
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#333]">Les plus populaires</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F2994A]" />
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12 text-red-500">
              {error}
            </div>
          ) : (
            featuredProducts.slice(0, 8).map((product) => {
              const productId = product._id || product.id;
              const productImage = product.images?.[0] || product.image;
              const promoPrice = product.promoPrice || (product.promo && product.promo < 100 ? Math.round(product.price * (1 - product.promo / 100)) : null);
              const hasPromo = promoPrice && promoPrice < product.price;
              const isInCart = cart.some(item => item.id === productId);
              const handleCartAction = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isInCart) {
                  removeFromCart(productId);
                  toast.success('Produit retiré du panier', { position: 'top-right', autoClose: 2000 });
                } else {
                  addToCart({
                    id: productId,
                    name: product.name,
                    price: promoPrice || product.price,
                    image: productImage,
                    quantity: 1
                  });
                  toast.success('Produit ajouté au panier', { position: 'top-right', autoClose: 2000 });
                }
              };
              return (
                <div key={productId} className="group">
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
                    {/* Image container */}
                    <div className="relative w-full h-0 pb-[100%] bg-gray-50 overflow-hidden">
                      <Link href={`/products/${productId}`} className="block w-full h-full">
                        <img
                          src={resolveImageUrl(productImage)}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/200x200?text=Image+Not+Found';
                          }}
                        />
                      </Link>
                       {/* Badge Nouveau seulement si moins d'un mois */}
                       {isProductNew(product.createdAt) && (
                         <span className="absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded-full bg-blue-500 text-white shadow-md">
                           Nouveau
                         </span>
                       )}

                      {/* Bouton panier */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                          onClick={handleCartAction}
                          className={`${isInCart ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-[#F2994A] hover:bg-[#F2994A] hover:text-white'} rounded-full px-4 py-2 shadow-lg flex items-center justify-center transform transition-all duration-300 hover:scale-105`}
                          title={isInCart ? 'Retirer du panier' : 'Ajouter au panier'}
                        >
                          {isInCart ? (
                            <Trash2 size={16} className="mr-2" />
                          ) : (
                            <ShoppingCart size={16} className="mr-2" />
                          )}
                          <span className="font-medium">{isInCart ? 'Retirer' : 'Ajouter'}</span>
                        </button>
                      </div>
                    </div>
                    {/* Product info */}
                    <div className="p-4 flex-1 flex flex-col text-center">
                      <Link href={`/products/${productId}`} className="flex-1 flex flex-col">
                        <h3 className="text-base text-gray-800 font-medium mb-2 line-clamp-2 hover:text-[#F2994A] transition-colors">
                          {product.name}
                        </h3>
                        {/* Affichage des prix avec style promo */}
                        <div className="mt-auto">
                          {hasPromo ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-[#F2994A] font-bold text-xl">
                                  {promoPrice?.toLocaleString()} FCFA
                                </span>
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  -{Math.round((1 - promoPrice / product.price) * 100)}%
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
              );
            })
          )}
        </div>
      </div>
    </section>
  )
}