'use client'

import { useState, useEffect } from 'react'
import { Star, Filter } from 'lucide-react'

export default function ProductFilters({ filters, onFiltersChange, subcategories = [] }) {
  const [selectedSubcategories, setSelectedSubcategories] = useState(filters.subcategories || []);
  const [isOpen, setIsOpen] = useState(false);

  // Met à jour l'état local si les filtres parents changent
  useEffect(() => {
    setSelectedSubcategories(filters.subcategories || []);
  }, [filters.subcategories]);

  const resetFilters = () => {
    onFiltersChange({
      priceRange: [0, 1000000],
      rating: 0,
      sortBy: 'popularity',
      subcategories: []
    });
  };

  const hasActiveFilters = 
    filters.priceRange[0] !== 0 ||
    filters.priceRange[1] !== 1000000 ||
    filters.rating !== 0 ||
    (filters.subcategories && filters.subcategories.length > 0);

  const handlePriceChange = (newRange) => {
    onFiltersChange({ ...filters, priceRange: newRange })
  }

  const handleRatingChange = (rating) => {
    onFiltersChange({ ...filters, rating })
  }

  const handleSortChange = (sortBy) => {
    onFiltersChange({ ...filters, sortBy })
  }

  const handleSubcategoryChange = (subcategoryId) => {
    const newSelected = selectedSubcategories.includes(subcategoryId)
      ? selectedSubcategories.filter(id => id !== subcategoryId)
      : [...selectedSubcategories, subcategoryId]
    
    setSelectedSubcategories(newSelected)
    onFiltersChange({ ...filters, subcategories: newSelected })
  }

  const renderStars = (rating) => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-[#F2994A] text-[#F2994A]' : 'text-gray-300'}
        />
      )
    }
    return stars
  }

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-[#DDD8B8] px-4 py-2 rounded-lg shadow-md w-full justify-center"
        >
          <Filter size={20} />
          <span className="text-black">Filtres</span>
        </button>
      </div>

      {/* Filters */}
      <div className={`bg-[#DDD8B8] rounded-lg shadow-md p-6 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">Filtres</h3>
          {hasActiveFilters && (
            <button 
              onClick={resetFilters}
              className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Subcategories */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-black">Sous-catégories</h4>
          <div className="space-y-2">
                {Array.isArray(subcategories) && subcategories.length > 0 ? (
                  subcategories.map((subcategory) => {
                    const subId = subcategory._id || subcategory;
                    const subName = typeof subcategory === 'object' ? subcategory.name : subcategory;
                    const isChecked = selectedSubcategories.includes(subId);
                    
                    return (
                      <label key={subId} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSubcategoryChange(subId)}
                          className="rounded border-gray-300 text-[#F2994A] focus:ring-[#DDD8B8]"
                        />
                        <span className="ml-2 text-sm text-black">
                          {subName}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">Aucune sous-catégorie disponible</p>
                )}
          </div>
        </div>

        {/* Price range */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-black">Prix</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceChange([parseInt(e.target.value) || 0, filters.priceRange[1]])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DDD8B8]"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceChange([filters.priceRange[0], parseInt(e.target.value) || 1000000])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DDD8B8]"
              />
            </div>
            <div className="space-y-2">
              {[
                { label: 'Moins de 50 000 FCFA', range: [0, 50000] },
                { label: '50 000 - 200 000 FCFA', range: [50000, 200000] },
                { label: '200 000 - 500 000 FCFA', range: [200000, 500000] },
                { label: 'Plus de 500 000 FCFA', range: [500000, 10000000] }
              ].map((option) => (
                <label key={option.label} className="flex items-center">
                  <input
                    type="radio"
                    name="priceRange"
                    onChange={() => handlePriceChange(option.range)}
                    className="text-[#F2994A] focus:ring-[#DDD8B8]"
                  />
                  <span className="ml-2 text-sm text-black">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-black">Note minimum</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  onChange={() => handleRatingChange(rating)}
                  className="text-[#F2994A] focus:ring-[#DDD8B8]"
                />
                <div className="ml-2 flex items-center space-x-1">
                  <div className="flex">
                    {renderStars(rating)}
                  </div>
                  <span className="text-sm text-gray-500">& plus</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-black">Trier par</h4>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DDD8B8]"
          >
            <option value="popularity">Popularité</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="rating">Mieux notés</option>
            <option value="newest">Plus récents</option>
          </select>
        </div>

        {/* Clear filters */}
        <button
          onClick={() => onFiltersChange({ priceRange: [0, 1000000], rating: 0, sortBy: 'popularity' })}
          className="w-full bg-[#F2994A] text-black px-4 py-2 rounded-lg hover:bg-[#F2994A] transition-colors"
        >
          Effacer les filtres
        </button>
      </div>
    </>
  )
}