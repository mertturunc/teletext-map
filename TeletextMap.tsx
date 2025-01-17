"use client"

import React, { useState, useEffect, useCallback } from 'react'
import styles from './TeletextMap.module.css'
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

interface MapPosition {
  lat: number
  lng: number
  zoom: number
}

const TeletextMap: React.FC = () => {
  const [position, setPosition] = useState<MapPosition>({
    lat: 41.014266,
    lng: 28.994267,
    zoom: 14
  })
  const [asciiMap, setAsciiMap] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const mapSize = 400
  const characters = ' .:=+*#%@'
  const mapWidth = 40
  const mapHeight = 25

  const getMapImage = useCallback(async () => {
    const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${position.lng},${position.lat},${position.zoom}/${mapSize}x${mapSize}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
    
    try {
      setLoading(true)
      const response = await fetch(url)
      const blob = await response.blob()
      
      // Create canvas and draw image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      canvas.width = mapSize
      canvas.height = mapSize
      
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = URL.createObjectURL(blob)
      })
      
      ctx.drawImage(img, 0, 0)
      
      // Convert to ASCII
      const ascii: string[] = []
      const cellWidth = mapSize / mapWidth
      const cellHeight = mapSize / mapHeight
      
      for (let y = 0; y < mapHeight; y++) {
        let line = ''
        for (let x = 0; x < mapWidth; x++) {
          const data = ctx.getImageData(x * cellWidth, y * cellHeight, cellWidth, cellHeight)
          let avg = 0
          
          for (let i = 0; i < data.data.length; i += 4) {
            const r = data.data[i]
            const g = data.data[i + 1]
            const b = data.data[i + 2]
            avg += (r + g + b) / 3
          }
          
          avg = avg / (data.data.length / 4)
          const charIndex = Math.floor(avg / 256 * characters.length)
          line += characters[charIndex]
        }
        ascii.push(line)
      }
      
      setAsciiMap(ascii)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching map:', error)
      setLoading(false)
    }
  }, [position])

  useEffect(() => {
    getMapImage()
  }, [getMapImage])

  const moveMap = (dlat: number, dlng: number) => {
    setPosition(prev => ({
      ...prev,
      lat: prev.lat + dlat,
      lng: prev.lng + dlng
    }))
  }

  const zoom = (delta: number) => {
    setPosition(prev => ({
      ...prev,
      zoom: Math.max(1, Math.min(20, prev.zoom + delta))
    }))
  }

  return (
    <div className={styles.teletextContainer}>
      <div className={styles.teletextScreen}>
        <h1 className={styles.title}>TELETEXT MAP</h1>
        <div className={styles.coordinates}>
          LAT: {position.lat.toFixed(4)} LON: {position.lng.toFixed(4)} Z: {position.zoom}
        </div>
        <div className={styles.mapContainer}>
          {loading ? (
            <div className={styles.loading}>LOADING MAP...</div>
          ) : (
            asciiMap.map((row, index) => (
              <div key={index} className={styles.mapRow}>
                {row.split('').map((char, charIndex) => (
                  <span key={charIndex} className={styles.mapChar}>
                    {char}
                  </span>
                ))}
              </div>
            ))
          )}
        </div>
        <div className={styles.controls}>
          <div className={styles.controlsRow}>
            <Button variant="outline" onClick={() => moveMap(0.01, 0)} size="icon">
              <ArrowUp className="h-4 w-4 text-black" />
            </Button>
          </div>
          <div className={styles.controlsRow}>
            <Button variant="outline" onClick={() => moveMap(0, -0.01)} size="icon">
              <ArrowLeft className="h-4 w-4 text-black" />
            </Button>
            <Button variant="outline" onClick={() => moveMap(-0.01, 0)} size="icon">
              <ArrowDown className="h-4 w-4 text-black" />
            </Button>
            <Button variant="outline" onClick={() => moveMap(0, 0.01)} size="icon">
              <ArrowRight className="h-4 w-4 text-black" />
            </Button>
          </div>
          <div className={styles.controlsRow}>
            <Button variant="outline" onClick={() => zoom(1)} size="icon">
              <ZoomIn className="h-4 w-4 text-black" />
            </Button>
            <Button variant="outline" onClick={() => zoom(-1)} size="icon">
              <ZoomOut className="h-4 w-4 text-black" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeletextMap

