"use client"
import { useEffect, useRef } from "react"

const API_BASE = "http://localhost:4000/api"

export default function AdminOrderNotifier() {
  const audioRef = useRef(null)

  useEffect(() => {
    let interval
    let audio = audioRef.current
    if (!audio && typeof window !== "undefined") {
      audio = new window.Audio("/sounds/notification.mp3")
      audio.loop = true
      audioRef.current = audio
    }
    async function pollOrders() {
      try {
        const res = await fetch(`${API_BASE}/orders`)
        if (!res.ok) return
        const data = await res.json()
        const unseen = (data.orders || []).filter(o => o.isSeen === false)
        if (unseen.length > 0) {
          if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {})
          }
        } else {
          if (audio && !audio.paused) {
            audio.pause()
            audio.currentTime = 0
          }
        }
      } catch {}
    }
    pollOrders()
    interval = setInterval(pollOrders, 2000)
    return () => {
      clearInterval(interval)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [])

  return null
}
