import { NextResponse } from 'next/server'
import { MAP_SIZE } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const zoom = searchParams.get('zoom')
  
  const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${lng},${lat},${zoom}/${MAP_SIZE}x${MAP_SIZE}?access_token=${MAPBOX_API_KEY}`

  const response = await fetch(url)
  const data = await response.arrayBuffer()

  return new NextResponse(data, {
    headers: {
      'Content-Type': 'image/png'
    }
  })
}