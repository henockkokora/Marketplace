'use client'

import { useState, useEffect, useCallback, useContext } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Star, ShoppingCart, Truck, Shield, RotateCcw, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import { useCart } from '../../context/CartContext'

export default function ProductInfo({ product }) {
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const { cart, addToCart, removeFromCart } = useCart();

  // Vérifier si le produit est dans le panier
  useEffect(() => {
    const isProductInCart = cart.some(item => item.id === product._id);
    setIsInCart(isProductInCart);
  }, [cart, product._id]);

  useEffect(() => {
    if (product) {
      // Enregistrer un clic sur le produit
      const productId = pathname.split('/').pop()
      if (productId) {
        fetch(`http://localhost:4000/api/products/${productId}/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(console.error)
      }
    }
  }, [product, pathname]);

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      const itemToAdd = {
        id: product._id,
        name: product.name,
        price: product.promoPrice || product.price,
        quantity: quantity, // Utiliser la quantité sélectionnée
        image: product.images?.[0],
        stock: product.stock
      };
      
      // Vérifier la quantité disponible
      const existingItem = cart.find(item => item.id === product._id);
      const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      
      if (totalQuantity > product.stock) {
        toast.error(`Quantité non disponible. Il ne reste que ${product.stock} en stock.`, { 
          autoClose: 3000 
        });
        return;
      }
      
      // Si le produit existe déjà, mettre à jour la quantité
      if (existingItem) {
        updateQuantity(product._id, totalQuantity);
      } else {
        addToCart(itemToAdd);
      }
      
      toast.success(`${quantity} ${quantity > 1 ? 'articles ajoutés' : 'article ajouté'} au panier !`, { 
        autoClose: 2000 
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier :', error);
      toast.error('Une erreur est survenue lors de l\'ajout au panier', { 
        autoClose: 2000 
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveFromCart = async () => {
    try {
      setIsAdding(true);
      removeFromCart(product._id);
      toast.success('Produit retiré du panier', { autoClose: 2000 });
    } catch (error) {
      console.error('Erreur lors de la suppression du panier :', error);
      toast.error('Une erreur est survenue', { autoClose: 2000 });
    } finally {
      setIsAdding(false);
    }
  };

  const toggleCart = () => {
    if (isInCart) {
      handleRemoveFromCart();
    } else {
      handleAddToCart();
    }
  };

  // Gestion de la quantité
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  const increaseQuantity = () => setQuantity(prev => (product.stock ? Math.min(product.stock, prev + 1) : prev + 1));

  // Fonction pour afficher les étoiles de notation
  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-[#DDD8B8]'}
        />
      )
    }
    return stars
  }

  const hasPromo = product.promoPrice && product.promoPrice < product.price;
  const discount = hasPromo ? 
    Math.round(((product.price - product.promoPrice) / product.price) * 100) : 0;
  const savings = hasPromo ? product.price - product.promoPrice : 0;

  // Rendu du composant
  return (
    <div className="space-y-6">
      {/* Bouton de retour */}
      <button 
        onClick={() => window.history.back()}
        className="flex items-center text-[#404E7C] hover:text-[#2C3E6B] transition-colors mb-2"
        aria-label="Retour à la page précédente"
      >
        <ArrowLeft className="mr-2" size={20} />
        <span className="font-medium">Retour</span>
      </button>
      {/* Title and rating */}
      <div>
        <h1 className="text-3xl font-bold text-[#333] mb-2">{product.name}</h1>
        <div className="flex items-center space-x-3">
          <div className="flex">
            {renderStars(product.rating)}
          </div>
          <span className="text-sm text-[black] font-medium">({product.reviews} avis)</span>
          <span className="w-1 h-1 bg-[black] rounded-full"></span>
          
        </div>
      </div>

      {/* Price */}
      <div className="space-y-3 mt-4">
        <div className="flex items-center space-x-4">
          {hasPromo ? (
            <>
              <span className="text-3xl font-bold text-[#F2994A]">
                {product.promoPrice.toLocaleString()} F CFA
              </span>
              <span className="text-xl text-[gray] line-through">
                {product.price.toLocaleString()} F CFA
              </span>
              <span className="bg-[#F2994A] text-white px-2 py-1 rounded text-sm font-semibold">
                -{discount}%
              </span>
            </>
          ) : (
            <span className="text-3xl font-bold text-[#F2994A]">
              {product.price.toLocaleString()} F CFA
            </span>
          )}
        </div>
        {hasPromo && (
          <p className="text-[#34C759] font-medium">
            Économisez {savings.toLocaleString()} F CFA
          </p>
        )}
      </div>

      {/* Stock status */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          product.stock > 10 ? 'bg-[#34C759]' : 
          product.stock > 0 ? 'bg-[#404E7C]' : 'bg-[#FF3B3F]'
        }`}></div>
        <span className={`font-medium ${
          product.stock > 10 ? 'text-[#34C759]' : 
          product.stock > 0 ? 'text-[#404E7C]' : 'text-[#FF3B3F]'
        }`}>
          {product.stock > 10 ? 'En stock' : 
           product.stock > 0 ? `Plus que ${product.stock} en stock` : 'Rupture de stock'}
        </span>
      </div>

      {/* Quantity selector */}
      <div className="flex items-center space-x-4">
        <label className="font-medium text-[#333]">Quantité:</label>
        <div className="flex items-center border border-[#DDD8B8] rounded-lg">
          <button
            onClick={decreaseQuantity}
            className="px-3 py-2 hover:bg-[#F7F7F7] transition-colors"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="px-4 py-2 border-l border-r border-[#DDD8B8]">
            {quantity}
          </span>
          <button
            onClick={increaseQuantity}
            className="px-3 py-2 hover:bg-[#F7F7F7] transition-colors"
            disabled={quantity >= product.stock}
          >
            +
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={toggleCart}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isInCart 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[#F2994A] hover:bg-[#f4ac6d] text-white'
            }`}
            disabled={product.stock === 0 || isAdding}
          >
            <ShoppingCart size={20} />
            <span>
              {isAdding 
                ? 'Traitement...' 
                : isInCart 
                  ? 'Retirer du panier' 
                  : 'Ajouter au panier'}
            </span>
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
        <div className="flex items-center space-x-3 text-sm">
          <Truck className="text-[#34C759]" size={20} />
          <div>
            <p className="font-medium">Livraison gratuite</p>
            <p className="text-[black]">À partir de 50 000 F CFA</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-sm">
          <Shield className="text-[#4A90E2]" size={20} />
          <div>
            <p className="font-medium">Garantie 2 ans</p>
            <p className="text-[black]">Protection complète</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-sm">
          <RotateCcw className="text-[#404E7C]" size={20} />
          <div>
            <p className="font-medium">Retour 30 jours</p>
            <p className="text-[black]">Satisfait ou remboursé</p>
          </div>
        </div>
      </div>



      {/* Description */}
      <div className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">Description</h3>
        <p className="text-[#333] leading-relaxed">
          {product.description}
        </p>
      </div>
    </div>
  );
}