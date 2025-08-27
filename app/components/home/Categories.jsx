import Link from 'next/link'
import { getMediaUrl, getFallbackImage } from '@/app/lib/media';

export default function Categories({ categories }) {
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 bg-red-600 text-white py-2 rounded-lg shadow">Parcourir par catégorie</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link
              key={category._id || category.id || category.name}
              href={`/categories/${category.name.toLowerCase()}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-[#F2994A]1A transition-all transform hover:scale-105 hover:-translate-y-1 overflow-hidden">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={category.image ? getMediaUrl(`uploads/${category.image}`) : getFallbackImage()}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x400?text=Image+Not+Found';
                    }}
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-gray-800 group-hover:text-[#F2994A] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.count} produits
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}