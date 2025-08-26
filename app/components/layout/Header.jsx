'use client'

import { useState, useEffect } from 'react'
import Marquee from '../ui/Marquee';
import Link from 'next/link'
import { ShoppingCart, Search } from 'lucide-react'

export default function Header({ onCartOpen }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Mettre à jour le compteur du panier au chargement
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(cart.length)
    }

    // Écouter les changements dans le localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        updateCartCount()
      }
    }

    // Mettre à jour le compteur initial
    updateCartCount()

    // Écouter les changements dans le localStorage
    window.addEventListener('storage', handleStorageChange)
    
    // Vérifier régulièrement les changements (pour les onglets du même domaine)
    const interval = setInterval(updateCartCount, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-none'}`}>
      {/* Top bar avec marquee */}
      <div className="bg-[#c5b97d] text-white overflow-hidden">
        <div className="py-0.5 text-xs font-medium">
          <Marquee speed={40}>
            <div className="flex items-center space-x-8 px-4">
              <span>Livraison express partout en Côte d'Ivoire</span>
              <span>Paiement 100% sécurisé</span>
              <span>Service client réactif</span>
              <span>Nouveautés disponibles chaque semaine</span>
              <span>Service client 7j/7</span>
            </div>
          </Marquee>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/logo_ecefa.png" alt="ECEFA" className="h-14 w-auto ml-4 md:ml-8" />
          </Link>

          {/* Search bar avec animation */}
          <div className="hidden md:flex flex-1 max-w-xs mx-8 transition-all duration-300 hover:max-w-2xl">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-[#DDD8B8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#DDD8B8] transition-all duration-300"
              />
              <button className="absolute right-0 top-0 h-full px-4 bg-[#F2994A] text-white rounded-full hover:bg-[#e68a3a] transition-colors">
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onCartOpen}
              className="flex items-center space-x-1 text-[#DDD8B8] hover:text-[#DDD8B8] relative transition-transform duration-150 hover:scale-105 hover:shadow-lg cursor-pointer"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <span className="relative">
                <ShoppingCart size={20} className="text-black" />
                <span className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-[#F2994A] text-white text-xs md:text-sm font-bold rounded-full h-6 w-6 md:h-7 md:w-7 flex items-center justify-center shadow-lg border-2 border-white animate-bounce" style={{ minWidth: '1.5rem' }}>
                  {cartCount}
                </span>
              </span>
              <span className="text-sm hidden md:block font-semibold text-[black]">Panier</span>
            </button>

          </div>
        </div>


      </div>

    </header>
  )
}