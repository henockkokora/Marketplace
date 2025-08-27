'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Eye, Download, Mail } from 'lucide-react'
import { getApiUrl, API_ENDPOINTS } from '@/app/lib/config'

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('month')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  async function fetchAnalytics() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.ANALYTICS}?range=${timeRange}`))
      if (!res.ok) throw new Error('Erreur lors du chargement des analytics')
      const data = await res.json()
      setAnalyticsData(data)
    } catch (err) {
      setError(err.message)
      setAnalyticsData(null)
    } finally {
      setLoading(false)
    }
  }

  // Données dynamiques depuis backend
  const topProductsByCategory = analyticsData?.topProductsByCategory || {}
  const mostClickedProducts = analyticsData?.mostClickedProducts || []
  const monthlyStats = analyticsData?.monthlyStats || []
  const contacts = analyticsData?.contacts || { registered: 0, uniqueVisitors: 0, total: 0 }

  // Nombre d'inscrits à la newsletter
  const [newsletterCount, setNewsletterCount] = useState(0);
  useEffect(() => {
    async function fetchNewsletterCount() {
      try {
        const response = await fetch(getApiUrl(`${API_ENDPOINTS.NEWSLETTER}/subscribers`), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setNewsletterCount(data.count || (data.data ? data.data.length : 0));
        }
      } catch (e) {
        setNewsletterCount(0);
      }
    }
    fetchNewsletterCount();
  }, []);

  // --- MODAL LOGIC ---
  const [showSubscribers, setShowSubscribers] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4000/api/newsletter/subscribers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSubscribers(data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnés:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSubscribers = () => {
    setShowSubscribers(true);
    fetchSubscribers();
  };

  const SubscribersModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Abonnés à la newsletter</h3>
          <button 
            onClick={() => setShowSubscribers(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : subscribers.length > 0 ? (
            <div className="space-y-2">
              {subscribers.map((subscriber, index) => (
                <div 
                  key={subscriber._id || index}
                  className="p-3 bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{subscriber.email}</p>
                    <p className="text-xs text-gray-500">
                      Inscrit le {new Date(subscriber.subscribedAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Actif
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Aucun inscrit à la newsletter pour le moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function exportContactsPDF() {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Contacts', 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [['Inscrits', 'Visiteurs uniques', 'Total']],
      body: [[contacts.registered, contacts.uniqueVisitors, contacts.total]],
      theme: 'grid',
      headStyles: {fillColor: [64, 78, 124]},
      styles: {fontSize: 12, cellPadding: 3},
    });
    doc.save('contacts.pdf');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics & Rapports</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-[#404E7C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#404E7C]"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsData && [
          { 
            title: "Chiffre d'affaires", 
            value: `${analyticsData.revenue?.toLocaleString() || '0'} FCFA`, 
            change: analyticsData.revenueChange, 
            icon: DollarSign, 
            color: 'green' 
          },
          { 
            title: "Commandes", 
            value: analyticsData.orders || '0', 
            change: analyticsData.ordersChange, 
            icon: ShoppingCart, 
            color: 'blue' 
          },
          { 
            title: "Livraisons effectuées", 
            value: analyticsData.deliveredOrders || '0', 
            change: analyticsData.deliveredChange, 
            icon: Package, 
            color: 'purple' 
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 bg-${stat.color}-100 rounded-full`}>
                <stat.icon className={`text-${stat.color}-600`} size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.change > 0 && <TrendingUp className="text-green-500 mr-1" size={16} />}
              {stat.change < 0 && <TrendingDown className="text-red-500 mr-1" size={16} />}
              <span className={`text-sm font-medium ${stat.change > 0 ? 'text-green-600' : stat.change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {stat.change > 0 ? '+' : ''}{stat.change}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs période précédente</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Category */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Top produits par catégorie</h3>
          </div>
          <div className="space-y-6">
            {Object.keys(topProductsByCategory).length === 0 && <div className="text-gray-400">Aucune donnée</div>}
            {Object.entries(topProductsByCategory).map(([category, products]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-800 mb-3">{category}</h4>
                <div className="space-y-2">
                  {products.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-[#404E7C]1A text-[#404E7C] rounded-full flex items-center justify-center text-sm font-medium mr-3">{index + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sales} ventes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{product.revenue?.toLocaleString()} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Clicked Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Articles les plus cliqués</h3>
          </div>
          <div className="space-y-3">
            {mostClickedProducts.length === 0 && <div className="text-gray-400">Aucune donnée</div>}
            {mostClickedProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">{index + 1}</span>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                </div>
                <div className="flex items-center text-right">
                  <Eye className="text-gray-400 mr-1" size={16} />
                  <span className="font-medium">{product.clicks?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Ventes mensuelles</h3>
        </div>
        <div className="space-y-4">
          {monthlyStats.length === 0 && <div className="text-gray-400">Aucune donnée</div>}
          {monthlyStats.map((stat) => (
            <div key={stat.month} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-gray-600">{stat.month}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div className="bg-[#404E7C] h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${monthlyStats.reduce((max, s) => Math.max(max, s.sales), 1) ? (stat.sales / monthlyStats.reduce((max, s) => Math.max(max, s.sales), 1)) * 100 : 0}%` }}>
                  <span className="text-white text-xs font-medium">{stat.sales?.toLocaleString()} FCFA</span>
                </div>
              </div>
              <div className="w-20 text-sm text-gray-600 text-right">{stat.orders} cmd</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Recycling Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Contacts</h3>
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleOpenSubscribers}
              className="flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white font-semibold text-base transition-all duration-200 hover:from-blue-600 hover:to-purple-600 hover:shadow-2xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm2 6H6a2 2 0 01-2-2V8a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2z" />
              </svg>
              Voir les inscrits à la newsletter
            </button>
          </div>
          {showSubscribers && <SubscribersModal />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="text-[#404E7C]" size={28} />
            </div>
            <div className="text-xs text-gray-500 mb-1">Inscrits à la newsletter</div>
            <p className="text-2xl font-bold text-gray-900">{newsletterCount.toLocaleString()}</p>
          </div>
          
          
        </div>
      </div>
    </div>
  )
}