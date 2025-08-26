'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMuted] = useState(true)
  const videoRef = useRef(null)

  useEffect(() => {
    // Démarrer la lecture automatique de la vidéo
    if (videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current.play()
        } catch (err) {
          // Gestion silencieuse des erreurs de lecture automatique
        }
      }
      playVideo()
    }
  }, [])

  const slides = [
    {
      id: 1,
      title: 'Offres Spéciales Black Friday',
      subtitle: 'Jusqu\'à -70% sur tous les produits',
      image: 'https://images.pexels.com/photos/5632382/pexels-photo-5632382.jpeg?auto=compress&cs=tinysrgb&w=1200',
      cta: 'Voir les offres'
    },
    {
      id: 2,
      title: 'Nouveautés de la semaine',
      subtitle: 'Découvrez les derniers produits tendance',
      image: 'https://images.pexels.com/photos/974964/pexels-photo-974964.jpeg?auto=compress&cs=tinysrgb&w=1200',
      cta: 'Découvrir'
    },
    {
      id: 3,
      title: 'Livraison gratuite',
      subtitle: 'Sur toutes vos commandes de plus de 50€',
      image: 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?auto=compress&cs=tinysrgb&w=1200',
      cta: 'Commander maintenant'
    }
  ]
  


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Vidéo de bienvenue à la place du carrousel */}
      <div className="md:col-span-2 h-[300px] md:h-[350px] overflow-hidden rounded-xl bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/video-bienvenue.mp4" type="video/mp4" />
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      </div>
    
    {/* Vidéo publicitaire */}
    <div className="h-[300px] md:h-[350px] overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/VIDEO-PUBLICITAIRE.mp4" type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    </div>
  </div>
  )
}
