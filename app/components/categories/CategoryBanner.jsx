import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CategoryBanner({ category }) {
  return (
    <div className="bg-white pt-4 pb-6 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-gray-600 text-lg">
                {category.description}
              </p>
            )}
          </div>
          <Link 
            href="/"
            className="mt-4 md:mt-0 flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Retour à l'accueil</span>
          </Link>
        </div>
      </div>
    </div>
  )
}