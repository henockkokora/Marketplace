'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Layout from '../../components/layout/Layout'
import CategoryBanner from '../../components/categories/CategoryBanner'
import ProductFilters from '../../components/categories/ProductFilters'
import ProductGrid from '../../components/categories/ProductGrid'
import { getApiUrl, API_ENDPOINTS } from '../../lib/config'

export default function CategoryPage() {
  const params = useParams()
  const { slug } = params
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [category, setCategory] = useState(null)
  const [filters, setFilters] = useState({
    priceRange: [0, 1000000],
    rating: 0,
    sortBy: 'popularity',
    subcategories: []
  })

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Récupérer la catégorie par son slug avec ses sous-catégories
        const categoryResponse = await fetch(getApiUrl(`${API_ENDPOINTS.CATEGORIES}/slug/${slug}?populate=subcategories`));
        if (!categoryResponse.ok) {
          throw new Error('Catégorie non trouvée');
        }
        const categoryData = await categoryResponse.json();
        setCategory(categoryData);

        // Récupérer les produits de la catégorie et de ses sous-catégories
        let productsResponse;
        
        // Si la catégorie a des sous-catégories, on filtre par ces sous-catégories
        if (categoryData.subcategories && categoryData.subcategories.length > 0) {
          const subcategoryIds = categoryData.subcategories.map(sub => sub._id);
          productsResponse = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}?subcategory=${subcategoryIds.join(',')}`));
        } else {
          // Si pas de sous-catégories, on filtre par la catégorie principale
          productsResponse = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}?category=${categoryData._id}`));
        }
        
        if (!productsResponse.ok) {
          throw new Error('Erreur lors du chargement des produits');
        }
        const productsData = await productsResponse.json();
        // Vérification que productsData est bien un tableau
        if (!Array.isArray(productsData)) {
          throw new Error('Format de données invalide pour les produits');
        }
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError(error.message || 'Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [slug]);

  useEffect(() => {
    let tempProducts = [...products];

    // Filtre par prix
    tempProducts = tempProducts.filter(p => {
      const price = p.promoPrice || p.price;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Filtre par note
    if (filters.rating > 0) {
      tempProducts = tempProducts.filter(p => (p.averageRating || 0) >= filters.rating);
    }

    // Filtre par sous-catégories
    if (filters.subcategories && filters.subcategories.length > 0) {
      tempProducts = tempProducts.filter(p => 
        p.subcategory && filters.subcategories.includes(p.subcategory._id || p.subcategory)
      );
    }

    // Tri
    tempProducts.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc':
          return (a.promoPrice || a.price) - (b.promoPrice || b.price);
        case 'price-desc':
          return (b.promoPrice || b.price) - (a.promoPrice || a.price);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default: // 'popularity'
          return (b.popularity || 0) - (a.popularity || 0);
      }
    });

    setFilteredProducts(tempProducts);
  }, [filters, products]);

  // État de chargement
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 shadow">
                  <div className="bg-gray-200 h-48 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Affichage normal
  return (
    <Layout>
      {isLoading ? (
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Chargement en cours...</p>
        </div>
      ) : error ? (
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : category ? (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              aria-label="Retour"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-base font-medium">Retour</span>
            </button>
            <h1 className="text-3xl font-bold">{category.name}</h1>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-1/4">
              <ProductFilters 
                filters={filters} 
                onFiltersChange={setFilters}
                subcategories={category.subcategories || []}
              />
            </aside>
            <main className="lg:w-3/4">
              {filteredProducts.length > 0 ? (
                <ProductGrid products={filteredProducts} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">Aucun produit disponible pour cette catégorie</p>
                </div>
              )}
            </main>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Catégorie non trouvée</p>
        </div>
      )}
    </Layout>
  )
}