'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'

export default function ImageCarousel({ images, video }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  
  // S'assurer que les images sont un tableau et filtrer les valeurs nulles ou vides
  const allMedia = Array.isArray(images) 
    ? images.filter(img => img && img.trim() !== '')
    : [];
    
  // Ajouter la vidéo si elle existe
  if (video && video.trim() !== '') {
    allMedia.push({ type: 'video', url: video });
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length)
  }

  const currentMedia = allMedia[currentIndex]
  const isVideo = currentMedia?.type === 'video'

  return (
    <div className="space-y-4">
      {/* Main display */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {isVideo ? (
          <div className="w-full h-full">
            {showVideo ? (
              <iframe
                src={currentMedia.url}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
              />
            ) : (
              <div
                className="w-full h-full bg-gray-800 flex items-center justify-center cursor-pointer"
                onClick={() => setShowVideo(true)}
              >
                <div className="text-center text-white">
                  <Play size={64} className="mx-auto mb-4" />
                  <p className="text-lg">Cliquez pour voir la vidéo</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            {currentMedia ? (
              <img
                src={currentMedia}
                alt={`Image ${currentIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Erreur de chargement de l\'image:', currentMedia);
                  e.target.onerror = null; // Évite les boucles d'erreur
                  e.target.src = '/images/placeholder-product.png'; // Image de remplacement
                }}
              />
            ) : (
              <div className="text-gray-400">Image non disponible</div>
            )}
          </div>
        )}

        {/* Navigation arrows */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-90 p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allMedia.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto">
          {allMedia.map((media, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setShowVideo(false)
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-[#404E7C]' : 'border-[#404E7C]'
              }`}
            >
              {media.type === 'video' ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <Play size={16} className="text-white" />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <img
                    src={media}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder-thumbnail.png';
                    }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}