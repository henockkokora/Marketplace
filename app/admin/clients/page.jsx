'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, User, Mail, Phone, ShoppingCart, ArrowLeft, MoreVertical } from 'lucide-react'
import { getApiUrl, API_ENDPOINTS } from '../../../lib/config'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.ORDERS))
      if (!res.ok) throw new Error('Erreur lors du chargement des clients')
      const data = await res.json()
      const orders = data.orders || [];
      // Agréger les clients uniques à partir des commandes
      const clientMap = {}
      orders.forEach(order => {
        const key = order.user?.email || order.user?.name
        if (!key) return
        if (!clientMap[key]) {
          const name = order.user?.name || '-'
          clientMap[key] = {
            name,
            email: order.user?.email || '-',
            phone: order.user?.phone || '-',
            address: order.user?.address || '-',
            city: order.user?.city || '',
            country: order.user?.country || '',
            orders: 0,
            totalSpent: 0,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          }
        }
        clientMap[key].orders += 1
        clientMap[key].totalSpent += order.totalPrice || 0
      })
      setClients(Object.values(clientMap))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Nos Clients</h1>
          <p className="text-gray-500 mt-1">Gérez et consultez les informations de vos clients.</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#404E7C] hover:bg-[#303b5e] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au Dashboard
        </Link>
      </div>
      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F2994A] focus:border-transparent shadow-sm"
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {loading && <p className="px-6 py-4">Chargement...</p>}
      {error && <p className="px-6 py-2 text-red-600">{error}</p>}
      {/* Grille de clients */}
      {!selectedClient ? (
        filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClients.map((client, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-xl hover:border-[#F2994A] transition-all duration-300 cursor-pointer h-full"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-center justify-between mb-4">
                  <img
                    src={client.avatar}
                    alt={client.name}
                    className="w-16 h-16 rounded-full bg-gray-100"
                  />
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={e => { e.stopPropagation(); setSelectedClient(client) }}
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-gray-800 truncate">
                  {client.name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </p>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  {client.phone}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs bg-[#DDD8B8] text-white px-2 py-1 rounded">
                    {client.orders} commandes
                  </span>
                  <span className="text-xs font-semibold text-[#404E7C]">
                    {client.totalSpent.toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun client trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">Essayez d'ajuster votre recherche.</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <button onClick={() => setSelectedClient(null)} className="mb-4 text-gray-600 hover:text-[#DDD8B8]">← Retour</button>
          <h3 className="text-lg font-semibold mb-4">Détails du client</h3>
          <div className="space-y-2">
            <div><b>Nom :</b> {selectedClient.name}</div>
            <div><b>Email :</b> {selectedClient.email}</div>
            <div><b>Téléphone :</b> {selectedClient.phone}</div>
            <div><b>Adresse :</b> {selectedClient.address}{selectedClient.city ? ', ' + selectedClient.city : ''}{selectedClient.country ? ', ' + selectedClient.country : ''}</div>
            <div><b>Commandes :</b> {selectedClient.orders}</div>
            <div><b>Total dépensé :</b> {selectedClient.totalSpent.toLocaleString()} FCFA</div>
          </div>
        </div>
      )}
    </div>
  )
}
