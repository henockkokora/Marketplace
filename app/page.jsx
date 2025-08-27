'use client'

import { useState, useEffect } from 'react'
import { getApiUrl, API_ENDPOINTS } from './lib/config';
import Layout from './components/layout/Layout'
import Hero from './components/home/Hero'
import Categories from './components/home/Categories'
import FeaturedProducts from './components/home/FeaturedProducts'
import RecentlyAddedProducts from './components/home/RecentlyAddedProducts'
import SpecialOffers from './components/home/SpecialOffers'
import Newsletter from './components/home/Newsletter'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    // Charger les catégories et produits depuis le backend
    fetch(getApiUrl(API_ENDPOINTS.CATEGORIES))
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Error fetching categories:', err));

    fetch(getApiUrl(API_ENDPOINTS.PRODUCTS))
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
          {/* Sidebar Catégories */}
          <aside className="w-full md:w-44 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-full flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">Catégories</h2>
              <ul className="space-y-1.5 overflow-y-auto pr-1 -mr-1 flex-1">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <a
                      href={`/categories/${cat.name.toLowerCase()}`}
                      className="block px-3 py-1.5 text-sm rounded-md hover:bg-[#F2994A]/5 hover:text-[#F2994A] transition-all font-medium text-gray-700"
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Contenu principal */}
          <main className="flex-1 min-w-0">
            <Hero />
          </main>
        </div>

        {/* Autres sections */}
        <div className="mt-8">
          <Categories categories={categories} />
        </div>
        <div className="mt-8">
          <RecentlyAddedProducts products={products} />
        </div>
        <div className="mt-8">
          <FeaturedProducts />
        </div>
        <div className="mt-8">
          <SpecialOffers />
        </div>
      </div>
    </Layout>
  )
}