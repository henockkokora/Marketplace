'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger le panier depuis localStorage au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error('Erreur lors du chargement du panier:', error);
          localStorage.removeItem('cart');
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Sauvegarder le panier dans localStorage à chaque modification
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const addToCart = (product) => {
    setCart(prevCart => {
      // Vérifier si le produit est déjà dans le panier
      const existingProductIndex = prevCart.findIndex(item => item.id === product.id);
      
      if (existingProductIndex >= 0) {
        // Si le produit existe déjà, augmenter la quantité de la quantité spécifiée
        const newCart = [...prevCart];
        newCart[existingProductIndex] = {
          ...newCart[existingProductIndex],
          quantity: newCart[existingProductIndex].quantity + (product.quantity || 1)
        };
        return newCart;
      } else {
        // Sinon, ajouter le nouveau produit avec la quantité spécifiée (par défaut 1)
        return [...prevCart, { 
          ...product, 
          quantity: product.quantity || 1 
        }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  const cartItemCount = cart.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
        isInitialized
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
