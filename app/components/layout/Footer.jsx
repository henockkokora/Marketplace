import Link from 'next/link'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import Newsletter from '../home/Newsletter'

export default function Footer() {
  return (
    <footer className="bg-white text-black">
      <Newsletter />

      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company info */}
          <div>
            <img src="/logo_ecefa.png" alt="ECEFA" className="h-14 w-auto mb-4" />
            <p className="text-black mb-4">
              La marketplace de référence en Afrique. Trouvez tout ce dont vous avez besoin au meilleur prix.
            </p>
            <div className="flex space-x-4">
              <Facebook className="text-black hover:text-gray-600 cursor-pointer" size={20} />
              <Twitter className="text-black hover:text-gray-600 cursor-pointer" size={20} />
              <Instagram className="text-black hover:text-gray-600 cursor-pointer" size={20} />
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Liens Rapides</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-black hover:text-gray-600">À propos</Link></li>
              <li><Link href="/" className="text-black hover:text-gray-600">Contact</Link></li>
              <li><Link href="/" className="text-black hover:text-gray-600">FAQ</Link></li>
              <li><Link href="/" className="text-black hover:text-gray-600">Livraison</Link></li>
              <li><Link href="/" className="text-black hover:text-gray-600">Retours</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4">Catégories</h3>
            <ul className="space-y-2">
              <li><Link href="/categories/electronique" className="text-black hover:text-gray-600">Électronique</Link></li>
              <li><Link href="/categories/mode-et-vetements" className="text-black hover:text-gray-600">Mode</Link></li>
              <li><Link href="/categories/maison-et-cuisine" className="text-black hover:text-gray-600">Maison</Link></li>
              <li><Link href="/categories/sports-et-loisirs" className="text-black hover:text-gray-600">Sports</Link></li>
              <li><Link href="/categories/beaute-et-soins" className="text-black hover:text-gray-600">Beauté</Link></li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="text-black" size={18} />
                <span className="text-black">01 23 45 67 89</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="text-black" size={18} />
                <span className="text-black">contact@ECEFA.ci</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="mt-1 text-black" />
                <span className="text-black">123 Rue du Commerce<br />75001 Côte d'ivoire</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-black text-sm">
              © 2025 ECEFA. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-black hover:text-gray-600 text-sm">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-black hover:text-gray-600 text-sm">
                Conditions d'utilisation
              </Link>
              <Link href="/cookies" className="text-black hover:text-gray-600 text-sm">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}