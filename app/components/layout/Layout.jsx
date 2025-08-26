'use client'

import Header from './Header'
import Footer from './Footer'
import Cart from '../cart/Cart'
import { useState } from 'react'

export default function Layout({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCartOpen={() => setIsCartOpen(true)} />
      <main>{children}</main>
      <Footer />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}