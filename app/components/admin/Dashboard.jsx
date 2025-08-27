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
      const res = await fetch(getApiUrl(API_ENDPOINTS.ANALYTICS))
      if (!res.ok) throw new Error('Erreur lors du chargement des statistiques')
      const data = await res.json()
      setAnalyticsData(data)
    } catch (err) {
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
      value: analyticsData.revenue ? `${analyticsData.revenue.toLocaleString()} FCFA` : '-',
      change: (analyticsData.revenueChange > 0 ? '+' : '') + analyticsData.revenueChange + '%',
      changeType: analyticsData.revenueChange > 0 ? 'positive' : analyticsData.revenueChange < 0 ? 'negative' : 'neutral',
      icon: DollarSign
    },
    {
      title: 'Commandes',
      value: analyticsData.orders || '-',
      change: (analyticsData.ordersChange > 0 ? '+' : '') + analyticsData.ordersChange + '%',
      changeType: analyticsData.ordersChange > 0 ? 'positive' : analyticsData.ordersChange < 0 ? 'negative' : 'neutral',
      icon: ShoppingCart
    },
    {
      title: 'Livraisons effectuées',
      value: analyticsData.deliveredOrders || '-',
      change: (analyticsData.deliveredChange > 0 ? '+' : '') + analyticsData.deliveredChange + '%',
      changeType: analyticsData.deliveredChange > 0 ? 'positive' : analyticsData.deliveredChange < 0 ? 'negative' : 'neutral',
      icon: Package
    },
    {
      title: 'Produits',
      value: analyticsData.products || '-',
      change: (analyticsData.productsChange > 0 ? '+' : '') + analyticsData.productsChange + '%',
      changeType: analyticsData.productsChange > 0 ? 'positive' : analyticsData.productsChange < 0 ? 'negative' : 'neutral',
      icon: Package
    },
    {
      title: 'Clients livrés',
      value: analyticsData.customers != null ? analyticsData.customers : '-',
      change: (analyticsData.customersChange > 0 ? '+' : '') + analyticsData.customersChange + '%',
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
    return <div className="flex justify-center items-center h-64">Chargement du dashboard...</div>
  }
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>
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