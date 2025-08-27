'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../components/layout/Layout'
import ImageCarousel from '../../components/products/ImageCarousel'
import ProductInfo from '../../components/products/ProductInfo'
import ProductReviews from '../../components/products/ProductReviews'
import SimilarProducts from '../../components/products/SimilarProducts'

export default function ProductDetail() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || id === "undefined" || id === "") {
        setError('ID de produit non valide')
        setLoading(false)
        return
      }
      
      try {
        let url = getApiUrl(`${API_ENDPOINTS.PRODUCTS}/${id}`);
        const response = await fetch(url);
        if (!response.ok) {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch {}
          throw new Error(errorData.message || `Erreur serveur (${response.status})`);
        }
        const result = await response.json();
        // Certains endpoints renvoient directement le produit, d'autres un objet {success, data}
        if (result.success === false) {
          throw new Error(result.message || 'Erreur inconnue du serveur');
        }
        // Supporte les deux formats de retour
        const prod = result.data || result || null;
        if (!prod || (!prod._id && !prod.id)) {
          throw new Error('Produit non trouvé');
        }
        setProduct(prod);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err.message || 'Une erreur est survenue lors du chargement du produit')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-gray-200 h-8 rounded"></div>
                <div className="bg-gray-200 h-6 rounded w-2/3"></div>
                <div className="bg-gray-200 h-12 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">
            {error || 'Produit non trouvé'}
          </h1>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-[#F2994A] text-white px-6 py-2 rounded-lg hover:bg-[#e68a3e] transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* ImageCarousel avec taille réduite */}
          <div className="max-w-3xl mx-auto w-full">
            <ImageCarousel images={product.images} video={product.video} />
          </div>
          <ProductInfo product={product} />
        </div>
        {/* Ajout du nom du produit au-dessus des avis */}
        <h2 className="text-2xl font-semibold mb-6">Avis sur {product.name}</h2>
        <ProductReviews productId={product.id} reviews={product.reviews} productName={product.name} />
        <SimilarProducts category={product.category} currentId={product.id} />
      </div>
    </Layout>
  )
}