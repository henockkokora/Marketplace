'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Eye, CheckCircle, XCircle, Truck, Package, FileText, Download } from 'lucide-react'
import { getApiUrl, API_ENDPOINTS } from '../../lib/config'

// Animation CSS injectée dynamiquement pour le clignotement rapide du badge
if (typeof window !== 'undefined' && !document.getElementById('pulse-fast-keyframes')) {
  const style = document.createElement('style');
  style.id = 'pulse-fast-keyframes';
  style.innerHTML = `@keyframes pulse-fast {0%{box-shadow:0 0 0 0 rgba(220,38,38,0.7);}70%{box-shadow:0 0 0 8px rgba(220,38,38,0);}100%{box-shadow:0 0 0 0 rgba(220,38,38,0);}} .pulse-fast{animation:pulse-fast 0.5s infinite;}`;
  document.head.appendChild(style);
}

// Son de notification
const notificationSound = typeof window !== 'undefined' ? new Audio('/sounds/notification.mp3') : null;

export default function OrdersManager() {
  // --- STATES ---
  const [orders, setOrders] = useState({ orders: [], montantPromo: null, totalMontant: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // --- POLLING & NOTIFICATION ---
  useEffect(() => {
    fetchOrders()
    // Polling toutes les 7 secondes
    const interval = setInterval(() => {
      fetchOrders()
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  // Notification sonore si commandes non vues
  useEffect(() => {
    if (!orders.orders) return;
    const unseen = orders.orders.filter(o => o.isSeen === false)
    if (unseen.length > 0) {
      if (notificationSound) {
        notificationSound.loop = true;
        notificationSound.play().catch(()=>{})
      }
    } else {
      if (notificationSound) {
        notificationSound.pause();
        notificationSound.currentTime = 0;
      }
    }
    // Stop son à l'unmount
    return () => {
      if (notificationSound) {
        notificationSound.pause();
        notificationSound.currentTime = 0;
      }
    }
  }, [orders.orders])

  async function fetchOrders() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.ORDERS))
      if (!res.ok) throw new Error('Erreur lors du chargement des commandes')
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- STATUS UPDATE ---
  async function handleStatusChange(orderId, newStatus) {
    try {
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.ORDERS}/${orderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Erreur lors du changement de statut')
      await fetchOrders()
    } catch (err) {
      alert(err.message)
    }
  }

  // --- INVOICE & EXPORT ---
  const generateInvoice = (order) => {
    // Génère une facture PDF simple côté client
    const win = window.open('', '', 'width=800,height=600')
    win.document.write('<html><head><title>Facture</title></head><body>')
    win.document.write(`<h2>Facture commande ${order._id}</h2>`)
    win.document.write(`<p><b>Client:</b> ${order.user?.name || '-'}<br/>Email: ${order.user?.email || '-'}<br/>Téléphone: ${order.user?.phone || '-'}</p>`)
    win.document.write(`<p><b>Date:</b> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</p>`)
    win.document.write('<h3>Produits</h3><ul>')
    order.products?.forEach(item => {
      win.document.write(`<li>${item.name} x${item.quantity} — ${item.price?.toLocaleString()} FCFA</li>`)
    })
    win.document.write('</ul>')
    win.document.write(`<p><b>Total:</b> ${order.totalPrice?.toLocaleString()} FCFA</p>`)
    win.document.write(`<p><b>Adresse livraison:</b> ${order.shippingAddress?.address || '-'}, ${order.shippingAddress?.city || '-'}, ${order.shippingAddress?.country || '-'}</p>`)
    win.document.write(`<p><b>Statut:</b> ${order.status}</p>`)
    win.document.write('</body></html>')
    win.document.close()
    win.print()
  }

  const exportOrders = () => {
    // Exporte les commandes filtrées en CSV
    if (filteredOrders.length === 0) {
      alert('Aucune commande à exporter')
      return
    }
    const header = [
      'ID', 'Client', 'Email', 'Téléphone', 'Montant', 'Date', 'Statut', 'Adresse', 'Méthode paiement', 'Produits'
    ]
    const rows = filteredOrders.map(order => [
      order._id,
      order.user?.name || '-',
      order.user?.email || '-',
      order.user?.phone || '-',
      order.totalPrice?.toLocaleString() || '-',
      order.createdAt ? new Date(order.createdAt).toLocaleString() : '-',
      order.status,
      order.shippingAddress ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.country}` : '-',
      order.paymentMethod || '-',
      order.products?.map(p => `${p.name} x${p.quantity}`).join('; ')
    ])
    const csv = [header, ...rows]
      .map(row => row.map(val => `"${(val ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'commandes.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // --- FILTERED ORDERS ---
  const filteredOrders = (orders.orders || []).filter(order => {
    const matchesSearch = (order._id && order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.user?.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.user?.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // --- STATUS BADGES/ICONS ---
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Package className="text-[#DDD8B8]" size={16} />
      case 'delivered':
        return <CheckCircle className="text-green-600" size={16} />
      default:
        return <Package className="text-gray-600" size={16} />
    }
  }
  const getStatusText = (status) => {
    const statusMap = {
      pending: 'En attente',
      delivered: 'Livrée',
    }
    return statusMap[status] || 'Inconnu'
  }
  const getStatusBadge = (status) => {
    const badgeClasses = {
      pending: 'bg-[#DDD8B8]1A text-[#DDD8B8]',
      paid: 'bg-blue-100 text-blue-800',
      shipped: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {getStatusText(status)}
      </span>
    )
  }

  // --- RENDER ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des commandes</h2>
        <button
          onClick={exportOrders}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          <span>Exporter</span>
        </button>
      </div>
      {loading && <p className="px-6 py-4">Chargement...</p>}
      {error && <p className="px-6 py-2 text-red-600">{error}</p>}
      {!selectedOrder ? (
        <div className="bg-white rounded-lg shadow-md">
          {/* Filters */}
          <div className="p-6 border-b border-[#DDD8B8]">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DDD8B8]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DDD8B8]"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="delivered">Livrée</option>
                </select>
              </div>
            </div>
          </div>
          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{order._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.user?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.totalPrice?.toLocaleString()} FCFA</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                      onClick={async () => {
                        // Marquer la commande comme vue
                        try {
                          await fetch(getApiUrl(`${API_ENDPOINTS.ORDERS}/${order._id}/seen`), { method: 'PATCH' })
                          fetchOrders()
                        } catch {}
                        setSelectedOrder(order)
                      }}
                      className="text-[#DDD8B8] hover:text-[#F2994A] p-2"
                      title="Voir détails"
                    >
                      <span className="relative inline-block">
  <Eye size={16} />
  {order.isSeen === false && (
    <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-red-600 border-2 border-white shadow-lg pulse-fast" style={{animation: 'pulse-fast 0.5s infinite'}}></span>
  )}
</span>
                    </button>
                        <button
                          onClick={() => generateInvoice(order)}
                          className="text-blue-600 hover:text-blue-800 p-2"
                          title="Générer facture"
                        >
                          <FileText size={16} />
                        </button>
                        {/* Exemple de changement de statut rapide */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(order._id, 'delivered')}
                            className="text-green-600 hover:text-green-800 p-2"
                            title="Marquer comme livrée"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          )}
        </div>
      ) : (
        // --- DETAILS MODAL ---
        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-6 py-2 rounded-full bg-[#DDD8B8] hover:bg-[#F2994A] text-white font-bold text-lg shadow-lg transition"
              style={{ minWidth: 160 }}
            >
              ← Retour
            </button>
          </div>
          <h3 className="text-xl font-bold mb-6 text-center">Détails de la commande</h3>

          {/* Bloc infos client séparé */}
          <div className="mb-6 p-4 bg-[#f7f6f2] rounded-lg border border-[#DDD8B8]">
            <div className="font-semibold mb-2 text-[#F2994A]">Informations du client</div>
            <div><b>Nom :</b> {selectedOrder.clientInfo ? selectedOrder.clientInfo.name : selectedOrder.user?.name}</div>
            <div><b>Email :</b> {selectedOrder.clientInfo ? selectedOrder.clientInfo.email : selectedOrder.user?.email}</div>
            <div><b>Téléphone :</b> {selectedOrder.clientInfo ? selectedOrder.clientInfo.phone : selectedOrder.user?.phone}</div>
          </div>

          <div className="space-y-2">
            <div><b>ID :</b> {selectedOrder._id}</div>
            <div><b>Adresse livraison :</b> {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.country}</div>
            <div><b>Montant total :</b> {selectedOrder.totalPrice?.toLocaleString()} FCFA</div>
            {selectedOrder.promoAmount && selectedOrder.promoAmount > 0 && (
              <div><b>Montant promo appliqué :</b> {selectedOrder.promoAmount?.toLocaleString()} FCFA</div>
            )}
            <div><b>Date :</b> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</div>
            <div><b>Statut :</b> {getStatusBadge(selectedOrder.status)}</div>
            <div><b>Méthode de paiement :</b> Espèce</div>
            <div><b>Produits :</b>
              <ul className="list-disc ml-6">
                {selectedOrder.products?.map((item, idx) => (
                  <li key={idx}>{item.name} x{item.quantity} — {item.price?.toLocaleString()} FCFA</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}