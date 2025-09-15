import { TrendingUp, Package, ShoppingCart, Users, DollarSign, Folder } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl, API_ENDPOINTS } from '@/app/lib/config'

export default function Dashboard() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Pour ouverture modale depuis Dashboard
  // À ADAPTER selon ton intégration (context global ou prop callback)
  const openProductForm = typeof window !== 'undefined' && window.openProductForm ? window.openProductForm : () => {
    const event = new CustomEvent('openProductForm')
    window.dispatchEvent(event)
  }
  const openCategoryForm = typeof window !== 'undefined' && window.openCategoryForm ? window.openCategoryForm : () => {
    const event = new CustomEvent('openCategoryForm')
    window.dispatchEvent(event)
  }

  const router = useRouter()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    setLoading(true)
    setError(null)
    try {
      console.log('Tentative de récupération des analytics depuis:', getApiUrl(API_ENDPOINTS.ANALYTICS))
      const res = await fetch(getApiUrl(API_ENDPOINTS.ANALYTICS))
      console.log('Réponse reçue:', res.status, res.statusText)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Erreur API:', errorText)
        throw new Error(`Erreur ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      console.log('Données reçues:', data)
      setAnalyticsData(data)
    } catch (err) {
      console.error('Erreur lors du fetch:', err)
      setError(err.message)
      setAnalyticsData(null)
    } finally {
      setLoading(false)
    }
  }

  // Extraction des stats dynamiques
  const stats = analyticsData ? [
    {
      title: 'Ventes du mois',
      value: analyticsData.revenue !== undefined && analyticsData.revenue !== null ? `${analyticsData.revenue.toLocaleString()} FCFA` : '0 FCFA',
      change: analyticsData.revenueChange !== undefined && analyticsData.revenueChange !== null ? 
        `${analyticsData.revenueChange > 0 ? '+' : ''}${analyticsData.revenueChange.toFixed(1)}%` : '0%',
      changeType: analyticsData.revenueChange > 0 ? 'positive' : analyticsData.revenueChange < 0 ? 'negative' : 'neutral',
      icon: DollarSign
    },
    {
      title: 'Commandes',
      value: analyticsData.orders !== undefined && analyticsData.orders !== null ? analyticsData.orders : 0,
      change: analyticsData.ordersChange !== undefined && analyticsData.ordersChange !== null ? 
        `${analyticsData.ordersChange > 0 ? '+' : ''}${analyticsData.ordersChange.toFixed(1)}%` : '0%',
      changeType: analyticsData.ordersChange > 0 ? 'positive' : analyticsData.ordersChange < 0 ? 'negative' : 'neutral',
      icon: ShoppingCart
    },
    {
      title: 'Livraisons effectuées',
      value: analyticsData.deliveredOrders !== undefined && analyticsData.deliveredOrders !== null ? analyticsData.deliveredOrders : 0,
      change: analyticsData.deliveredChange !== undefined && analyticsData.deliveredChange !== null ? 
        `${analyticsData.deliveredChange > 0 ? '+' : ''}${analyticsData.deliveredChange.toFixed(1)}%` : '0%',
      changeType: analyticsData.deliveredChange > 0 ? 'positive' : analyticsData.deliveredChange < 0 ? 'negative' : 'neutral',
      icon: Package
    },
    {
      title: 'Produits',
      value: analyticsData.products !== undefined && analyticsData.products !== null ? analyticsData.products : 0,
      change: analyticsData.productsChange !== undefined && analyticsData.productsChange !== null ? 
        `${analyticsData.productsChange > 0 ? '+' : ''}${analyticsData.productsChange.toFixed(1)}%` : '0%',
      changeType: analyticsData.productsChange > 0 ? 'positive' : analyticsData.productsChange < 0 ? 'negative' : 'neutral',
      icon: Package
    },
    {
      title: 'Clients livrés',
      value: analyticsData.customers !== undefined && analyticsData.customers !== null ? analyticsData.customers : 0,
      change: analyticsData.customersChange !== undefined && analyticsData.customersChange !== null ? 
        `${analyticsData.customersChange > 0 ? '+' : ''}${analyticsData.customersChange.toFixed(1)}%` : '0%',
      changeType: analyticsData.customersChange > 0 ? 'positive' : analyticsData.customersChange < 0 ? 'negative' : 'neutral',
      icon: Users
    }
  ] : []

  // Commandes récentes dynamiques
  const recentOrders = analyticsData && analyticsData.recentOrders
    ? analyticsData.recentOrders.slice(0, 4)
    : []

  // Produits les plus vendus dynamiques
  const topProducts = analyticsData && analyticsData.topProductsByCategory && analyticsData.topProductsByCategory.length > 0
    ? analyticsData.topProductsByCategory.flatMap(cat => cat.products).slice(0, 4)
    : []

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#404E7C] mx-auto mb-4"></div>
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // --- QUICK ACTIONS FIX ---
  const handleAddProduct = () => {
    router.push('/admin/products')
    setTimeout(() => {
      const event = new CustomEvent('openProductForm')
      window.dispatchEvent(event)
    }, 350)
  }
  const handleAddCategory = () => {
    router.push('/admin/categories')
    setTimeout(() => {
      const event = new CustomEvent('openCategoryForm')
      window.dispatchEvent(event)
    }, 350)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-3 bg-[#404E7C]1A rounded-full">
                  <Icon className="text-[#404E7C]" size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="text-green-500 mr-1" size={16} />
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#404E7C] hover:bg-[#404E7C] transition-colors"
            onClick={handleAddProduct}
          >
            <Package className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium">Ajouter un produit</p>
          </button>
          <button
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#404E7C] hover:bg-[#404E7C] transition-colors"
            onClick={handleAddCategory}
          >
            <Folder className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium">Créer une catégorie</p>
          </button>
          <button
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#404E7C] hover:bg-[#404E7C] transition-colors"
            onClick={() => router.push('/admin/orders')}
          >
            <ShoppingCart className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium">Voir les commandes</p>
          </button>
        </div>
      </div>
    </div>
  )
}