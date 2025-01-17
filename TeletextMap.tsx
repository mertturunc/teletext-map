"use client"

import React, { useState, useEffect, useCallback } from 'react'
import styles from './TeletextMap.module.css'
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { MAP_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@/lib/constants'

interface MapPosition {
  lat: number
  lng: number
  zoom: number
}

const TeletextMap: React.FC = () => {
  const [position, setPosition] = useState<MapPosition>({
    lat: 41.014266,
    lng: 28.994267,
    zoom: 10
  })
  const [asciiMap, setAsciiMap] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)

  const characters = ' .:=+*#%@'

  // Example color mapping
  const colorMapping: Record<string, string> = {
    '#89CFF0': '#0000FF',
    '#90EE90': '#00FF00',
    '#FFFFFF': '#FFFF00',
    '#808080': '#A9A9A9',
    'default': '#FFFF00'
  }

  // Movement speed utility
  const getMovementSpeed = (zoom: number): number => {
    if (zoom < 3) return 5
    if (zoom < 5) return 3
    if (zoom < 7) return 1
    if (zoom < 10) return 0.5
    if (zoom < 13) return 0.1
    if (zoom < 16) return 0.05
    return 0.01
  }

  const getMapImage = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/map?lat=${position.lat}&lng=${position.lng}&zoom=${position.zoom}`
      )
      const blob = await response.blob()

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = MAP_SIZE
      canvas.height = MAP_SIZE

      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = URL.createObjectURL(blob)
      })

      ctx.drawImage(img, 0, 0)

      const ascii: string[] = []
      const cellWidth = MAP_SIZE / MAP_WIDTH
      const cellHeight = MAP_SIZE / MAP_HEIGHT

      for (let y = 0; y < MAP_HEIGHT; y++) {
        let line = ''

        for (let x = 0; x < MAP_WIDTH; x++) {
          const data = ctx.getImageData(x * cellWidth, y * cellHeight, cellWidth, cellHeight)
          let avg = 0
          let r = 0, g = 0, b = 0

          for (let i = 0; i < data.data.length; i += 4) {
            r += data.data[i]
            g += data.data[i + 1]
            b += data.data[i + 2]
            avg += (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3
          }

          const pixelCount = data.data.length / 4
          r = Math.round(r / pixelCount)
          g = Math.round(g / pixelCount)
          b = Math.round(b / pixelCount)
          avg = avg / pixelCount

          const charIndex = Math.floor((avg / 256) * characters.length)
          const color = determineTeletextColor(r, g, b)
          line += `<span style="color: ${color}">${characters[charIndex]}</span>`
        }
        ascii.push(line)
      }

      function determineTeletextColor(r: number, g: number, b: number): string {
        // Example logic to detect water, vegetation, roads, etc.
        if (b > r + 20 && b > g + 20) {
          return colorMapping['#89CFF0']
        }
        if (g > r + 20 && g > b + 20) {
          return colorMapping['#90EE90']
        }
        if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
          return r > 200 ? colorMapping['#FFFFFF'] : colorMapping['#808080']
        }
        return colorMapping.default
      }

      setAsciiMap(ascii)
    } catch (error) {
      console.error('Error fetching map:', error)
    } finally {
      setLoading(false)
    }
  }, [position])

  useEffect(() => {
    getMapImage()
  }, [getMapImage])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Decide movement speed based on current zoom
      const moveAmount = getMovementSpeed(position.zoom)

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          setPosition(prev => ({ ...prev, lat: prev.lat + moveAmount }))
          break
        case 'arrowdown':
        case 's':
          setPosition(prev => ({ ...prev, lat: prev.lat - moveAmount }))
          break
        case 'arrowleft':
        case 'a':
          setPosition(prev => ({ ...prev, lng: prev.lng - moveAmount }))
          break
        case 'arrowright':
        case 'd':
          setPosition(prev => ({ ...prev, lng: prev.lng + moveAmount }))
          break
        case '+':
        case '=':
          setPosition(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.5, 20) }))
          break
        case '-':
        case '_':
          setPosition(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.5, 1) }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [position.zoom])

  // Adjusted moveMap function
  const moveMap = (dlat: number, dlng: number) => {
    const moveAmount = getMovementSpeed(position.zoom)
    setPosition(prev => ({
      ...prev,
      lat: prev.lat + (dlat * moveAmount),
      lng: prev.lng + (dlng * moveAmount)
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
            <Button variant="outline" onClick={() => moveMap(1, 0)} size="icon">
              <ArrowUp className="h-4 w-4 text-black" />
            </Button>
          </div>
          <div className={styles.controlsRow}>
            <Button variant="outline" onClick={() => moveMap(0, -1)} size="icon">
              <ArrowLeft className="h-4 w-4 text-black" />
            </Button>
            <Button variant="outline" onClick={() => moveMap(-1, 0)} size="icon">
              <ArrowDown className="h-4 w-4 text-black" />
            </Button>
            <Button variant="outline" onClick={() => moveMap(0, 1)} size="icon">
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
        <div className={styles.tooltipContainer}>
          <TooltipProvider>
            <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
              <TooltipTrigger asChild onClick={() => setShowTooltip(!showTooltip)}>
                <Button variant="ghost" size="icon" className={styles.helpButton}>
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={styles.tooltipContent}>
                <p>Keyboard Controls:</p>
                <ul>
                  <li>Arrow Keys or WASD - Move Map</li>
                  <li>+ / - Keys - Zoom In/Out</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

export default TeletextMap
