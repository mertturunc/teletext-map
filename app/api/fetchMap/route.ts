import { NextResponse } from 'next/server'

const API_ENDPOINT = 'https://overpass-api.de/api/interpreter'

const QUERY = `
[out:json];
(
  way["highway"](51.5074,-0.1278,51.5076,-0.1276);
  node(w);
);
out body;
>;
out skel qt;
`

function convertToTeletext(data: any): string[] {
  const nodes = data.elements.filter((el: any) => el.type === 'node')
  const ways = data.elements.filter((el: any) => el.type === 'way')

  const minLat = Math.min(...nodes.map((n: any) => n.lat))
  const maxLat = Math.max(...nodes.map((n: any) => n.lat))
  const minLon = Math.min(...nodes.map((n: any) => n.lon))
  const maxLon = Math.max(...nodes.map((n: any) => n.lon))

  const mapSize = 20
  const teletextMap: string[][] = Array(mapSize).fill(0).map(() => Array(mapSize).fill('.'))

  ways.forEach((way: any) => {
    way.nodes.forEach((nodeId: number, index: number) => {
      if (index === 0) return
      const prevNode = nodes.find((n: any) => n.id === way.nodes[index - 1])
      const currNode = nodes.find((n: any) => n.id === nodeId)

      const x1 = Math.floor((prevNode.lon - minLon) / (maxLon - minLon) * (mapSize - 1))
      const y1 = Math.floor((prevNode.lat - minLat) / (maxLat - minLat) * (mapSize - 1))
      const x2 = Math.floor((currNode.lon - minLon) / (maxLon - minLon) * (mapSize - 1))
      const y2 = Math.floor((currNode.lat - minLat) / (maxLat - minLat) * (mapSize - 1))

      // Draw line between points
      const dx = Math.abs(x2 - x1)
      const dy = Math.abs(y2 - y1)
      const sx = x1 < x2 ? 1 : -1
      const sy = y1 < y2 ? 1 : -1
      let err = dx - dy
      let x = x1
      let y = y1

      while (true) {
        teletextMap[y][x] = '#'
        if (x === x2 && y === y2) break
        const e2 = 2 * err
        if (e2 > -dy) {
          err -= dy
          x += sx
        }
        if (e2 < dx) {
          err += dx
          y += sy
        }
      }
    })
  })

  return teletextMap.map(row => row.join(''))
}

export async function GET() {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(QUERY)}`,
    })

    if (!response.ok) {
      throw new Error('Failed to fetch map data')
    }

    const data = await response.json()
    const teletextMap = convertToTeletext(data)

    return NextResponse.json({ map: teletextMap })
  } catch (error) {
    console.error('Error fetching map data:', error)
    return NextResponse.json({ error: 'Failed to fetch map data' }, { status: 500 })
  }
}

