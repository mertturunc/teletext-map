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

interface ColoredMapChar {
  char: string;
  color: string;
}

const TeletextMap: React.FC = () => {
  const [position, setPosition] = useState<MapPosition>({
    lat: 41.014266,
    lng: 28.994267,
    zoom: 10
  })
  const [asciiMap, setAsciiMap] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const mapSize = 800
  const characters = ' .:=+*#%@'
  const mapWidth = 80
  const mapHeight = 50

  // Add color mapping object
  const colorMapping: Record<string, string> = {
    // Water (blue-ish)
    '#89CFF0': '#0000FF',
    // Parks/forests (green-ish)
    '#90EE90': '#00FF00',
    // Roads (yellow-ish)
    '#FFFFFF': '#FFFF00',
    // Buildings (gray-ish)
    '#808080': '#A9A9A9',
    // Default
    'default': '#FFFF00'
  };

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
        let line = '';
        
        for (let x = 0; x < mapWidth; x++) {
          const data = ctx.getImageData(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
          let avg = 0;
          let r = 0, g = 0, b = 0;
          
          // Calculate average RGB values for the cell
          for (let i = 0; i < data.data.length; i += 4) {
            r += data.data[i];
            g += data.data[i + 1];
            b += data.data[i + 2];
            avg += (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3;
          }
          
          // Get average RGB values
          const pixelCount = data.data.length / 4;
          r = Math.round(r / pixelCount);
          g = Math.round(g / pixelCount);
          b = Math.round(b / pixelCount);
          
          // Create color key from average RGB
          const colorKey = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
          
          // Calculate brightness for character selection
          avg = avg / pixelCount;
          const charIndex = Math.floor(avg / 256 * characters.length);
          
          // Map the color to our teletext palette
          const color = determineTeletextColor(r, g, b);
          line += `<span style="color: ${color}">${characters[charIndex]}</span>`;
        }
        ascii.push(line);
      }

      // Add helper function for color determination
      function determineTeletextColor(r: number, g: number, b: number): string {
        // Water detection (more blue than other channels)
        if (b > r + 20 && b > g + 20) {
          return colorMapping['#89CFF0'];
        }
        // Vegetation detection (more green)
        if (g > r + 20 && g > b + 20) {
          return colorMapping['#90EE90'];
        }
        // Roads/buildings (grayscale)
        if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
          return r > 200 ? colorMapping['#FFFFFF'] : colorMapping['#808080'];
        }
        return colorMapping.default;
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
                <div dangerouslySetInnerHTML={{ __html: row }} />
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

