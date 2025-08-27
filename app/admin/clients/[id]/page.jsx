'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react'

// Données de démonstration
const mockClient = {
  id: 1,
  name: 'Jean Dupont',
  email: 'jean.dupont@example.com',
  phone: '+225 07 12 34 56 78',
  address: '123 Rue des Lampions, Cocody, Abidjan',
  registrationDate: '2023-01-15',
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function ClientDetailPage({ params }) {
  const [client, setClient] = useState(mockClient)

  useEffect(() => {
    // fetch(`/api/clients/${params.id}`)
  }, [params.id])

  if (!client) {
    return <div>Chargement...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link 
          href="/admin/clients" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour à la liste des clients
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <User className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-sm text-gray-500">Client depuis le {formatDate(client.registrationDate)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Informations de contact</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{client.email}</p>
            </div>
          </div>
          <div className="flex items-start">
            <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Téléphone</p>
              <p className="text-sm text-gray-900">{client.phone}</p>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Adresse de livraison</p>
              <p className="text-sm text-gray-900">{client.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
