'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import jwtDecode from 'jwt-decode'  


import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Folder
} from 'lucide-react'
import SettingsPanel from './SettingsPanel'

import AdminOrderNotifier from './AdminOrderNotifier'

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()


  function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1] // payload
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}


useEffect(() => {
  const token = localStorage.getItem('token')
  

  if (!token) {
    console.log('Pas de token, redirection...')
    router.push('/admin/auth')
    return
  }

  const decoded = parseJwt(token)
  if (!decoded) {
   
    localStorage.removeItem('token')
    router.push('/admin/auth')
    return
  }

  const exp = decoded.exp
  if (!exp) {
   
    localStorage.removeItem('token')
    router.push('/admin/auth')
    return
  }

  if (Date.now() >= exp * 1000) {
   
    localStorage.removeItem('token')
    router.push('/admin/auth')
    return
  }


}, [router])



  const navigation = [
    { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
    { name: 'Catégories', href: '/admin/categories', icon: Folder },
    { name: 'Produits', href: '/admin/products', icon: Package },
    { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Clients', href: '/admin/clients', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { 
      name: 'Paramètres',
      href: '/admin/settings',
      icon: Settings,
      onClick: () => {
        setIsSettingsOpen(true)
        setIsSidebarOpen(false)
      }
    },
  ]

  const isActive = (href) => pathname === href

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsSidebarOpen(false)
    router.push('/admin/auth')
  }

  return (
    <>
      <AdminOrderNotifier />
      <div className="min-h-screen bg-[#F3F6FA]">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-white p-2 rounded-lg shadow-md"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#DDD8B8] border-r border-[#DDD8B8] text-black transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        
        {/* Navigation */}
        <nav className="mt-2">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              if (item.onClick) {
                return (
                  <button
                    key={item.name}
                    onClick={item.onClick}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      active
                        ? 'bg-white text-black font-bold shadow'
                        : 'text-black text-opacity-80 hover:bg-[#F4FFFD] hover:text-black'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </button>
                )
              } else {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      active
                        ? 'bg-white text-black font-bold shadow'
                        : 'text-black text-opacity-80 hover:bg-[#F4FFFD] hover:text-black'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                )
              }
            })}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-4 w-full px-4 space-y-2">
          {/* <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-3 text-black text-opacity-80 hover:bg-[#F2994A] hover:text-black rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Retour au site</span>
          </Link> */}

          {/* Bouton Déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-black text-opacity-80 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Administration
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Connecté en tant qu'administrateur
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div></>
  )
}
