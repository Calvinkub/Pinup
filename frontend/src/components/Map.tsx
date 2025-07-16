'use client'

import { useEffect, useRef, useState } from 'react'
import { useMapData } from '@/hooks/useMapData'
import { LayerOption } from '@/utils/layerUtils'
import LayerSelector from './LayerSelector/LayerSelector'

declare global {
  interface Window {
    longdo?: any;
  }
}

export default function Map({ landId }: { landId: number }) {
  const mapRef = useRef<any>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const overlayRefs = useRef<Record<string, any>>({})

  const [selectedLayers, setSelectedLayers] = useState<LayerOption[]>(['none'])
  const [isClient, setIsClient] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)

  const shouldFetchData = selectedLayers.some((layer) => layer !== 'none')
  const {
    zoningData,
    osmData,
    populationData,
    populationRangeData,
    landpricesubdData,
    landpricesubdRangeData,
    isLoading
  } = useMapData(landId, isClient && shouldFetchData)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load Longdo Map script and init map
  useEffect(() => {
    if (!mapDivRef.current || typeof window === 'undefined') return;

    const onLoad = () => {
      if (window.longdo && mapDivRef.current) {
        mapRef.current = new window.longdo.Map({
          placeholder: mapDivRef.current,
          location: { lon: 100.5018, lat: 13.7563 },
          zoom: 12
        })
        setIsMapReady(true)
      }
    }

    const existingScript = document.getElementById('longdo-map-script')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'longdo-map-script'
      script.src = 'https://api.longdo.com/map3/?key=cdeecf6753b08d52c1504f2d3fb4377e'
      script.async = true
      script.onload = onLoad
      document.body.appendChild(script)
    } else {
      onLoad()
    }
  }, [])

  // Manage layers overlay
  useEffect(() => {
    if (!mapRef.current || !window.longdo || !isMapReady) return;

    const addGeoJsonLayer = (id: string, geojson: any) => {
      if (!geojson || !window.longdo.Overlay?.GeoJSON) return;

      const overlay = new window.longdo.Overlay.GeoJSON({
        data: geojson,
        style: (feature: any) => {
          const pop = feature.properties?.DimPOP ?? 0;
          let fillColor = '#cccccc';
          if (pop > 3000) fillColor = '#d73027';
          else if (pop > 2000) fillColor = '#fc8d59';
          else if (pop > 1000) fillColor = '#fee08b';
          else if (pop > 0) fillColor = '#d9ef8b';

          return {
            lineColor: '#000000',
            lineWidth: 0.5,
            fillColor,
          };
        },
        onClick: (e: any) => {
          const props = e.feature?.properties;
          if (props) {
            window.longdo.Util.popup({
              location: e.location,
              html: `
                <b>${props.TAM_NAMT}</b><br/>
                ประชากร: ${props.DimPOP ?? 'ไม่ระบุ'}<br/>
                ราคาเฉลี่ย: ${props.price_AVG ?? 'ไม่ระบุ'}
              `
            });
          }
        }
      });

      mapRef.current.Overlays.add(overlay);
      overlayRefs.current[id] = overlay;
    }

    const removeGeoJsonLayer = (id: string) => {
      const overlay = overlayRefs.current[id];
      if (overlay) {
        mapRef.current.Overlays.remove(overlay);
        delete overlayRefs.current[id];
      }
    }

    const availableLayers: [string, any][] = [
      ['population', populationData],
      ['zoning', zoningData?.feature],
      ['landprice', landpricesubdData]
    ]

    // Add selected layers
    availableLayers.forEach(([id, data]) => {
      if (selectedLayers.includes(id as LayerOption) && !overlayRefs.current[id]) {
        addGeoJsonLayer(id, data);
      }
    })

    // Remove unselected layers
    Object.keys(overlayRefs.current).forEach((id) => {
      if (!selectedLayers.includes(id as LayerOption)) {
        removeGeoJsonLayer(id);
      }
    })

  }, [selectedLayers, isMapReady, populationData, zoningData, landpricesubdData])

  return (
    <div className="relative">
      <div className="w-full h-[20px] bg-white border-b border-gray-200 px-4 flex items-center justify-end">
        <LayerSelector
          selectedLayers={selectedLayers}
          setSelectedLayers={setSelectedLayers}
        />
      </div>
      <div ref={mapDivRef} className="map-container" />
    </div>
  )
}
