'use client'

import { X, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { getMediaUrl, getFallbackImage } from '@/app/lib/media'

export default function Cart({ isOpen, onClose }) {
  const { 
    cart: cartItems, 
    updateQuantity, 
    removeFromCart, 
    cartTotal: total,
    isInitialized 
  } = useCart();

  // Ne rien afficher tant que le panier n'est pas initialisé
  if (!isInitialized) return null;

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <ShoppingBag className="mr-2 text-[black]" size={20} />
              Panier ({cartItems.length})
            </h2>
            <button onClick={onClose} className="p-2  rounded-full">
              <X size={20} className="text-[#DDD8B8]" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag size={48} className="mx-auto mb-4 text-[#DDD8B8]" />
                <p className="text-[#DDD8B8]">Votre panier est vide</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                    <img
                      src={item.image ? getMediaUrl(`uploads/${item.image}`) : getFallbackImage()}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/200x200?text=Image+Not+Found';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-[black] font-semibold">{item.price} F CFA</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus size={14} className="text-[black]" />
                          </button>
                          <span className="px-2 py-1 bg-white rounded text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus size={14} className="text-[black]" />
                          </button>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                          className="text-red-500 hover:text-red-700"
                          title="Supprimer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>{total} F CFA</span>
              </div>
              <button
                className="w-full bg-[#F2994A] text-white py-3 rounded-lg font-semibold hover:bg-[#f3a867] transition-colors"
                onClick={() => {
                  window.location.href = '/checkout';
                  if (onClose) onClose();
                }}
              >
                Passer la commande
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Continuer mes achats
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}