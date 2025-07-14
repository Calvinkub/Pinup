'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { fixLeafletIcons } from '@/utils/leafletFix';
import { useMapData } from '@/hooks/useMapData';
import { MapProps } from '@/types/map';
import { LayerOption } from '@/utils/layerUtils';
import LayerSelector from './LayerSelector/LayerSelector';
import { MapLoading } from './MapLoading';
import { MapLayers } from './MapLayers';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const LayerControlWrapper = dynamic(() => import('./LayerControlWrapper'), { ssr: false });

export default function Map({ landId }: MapProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<LayerOption[]>(['none']);
  const [isLoadingLayers, setIsLoadingLayers] = useState(false);

  const shouldFetchData = selectedLayers.some(layer => layer !== 'none');
  const {
    zoningData, osmData, populationData, populationRangeData,
    landpricesubdData, landpricesubdRangeData, isLoading
  } = useMapData(landId, isClient && shouldFetchData);

  useEffect(() => {
    setIsClient(true);
    fixLeafletIcons();
  }, []);

  if (!isClient || isLoadingLayers || (shouldFetchData && isLoading)) return <MapLoading />;

  return (
    <div className="relative">
      {/* Header bar */}
      <div className="w-full h-[20px] bg-white border-b border-gray-200 px-4 flex items-center justify-end">
        <LayerSelector
          selectedLayers={selectedLayers}
          setSelectedLayers={(layers) => {
            setSelectedLayers(layers);
            setIsLoadingLayers(true);
            setTimeout(() => setIsLoadingLayers(false), 1000);
          }}
        />
      </div>
      <MapContainer center={[13.7563, 100.5018]} zoom={16} className="map-container">
        <LayerControlWrapper />
        <MapLayers
          osmData={selectedLayers.includes('osm') ? osmData : null}
          zoningData={selectedLayers.includes('zoning') ? zoningData : null}
          populationData={selectedLayers.includes('population') ? populationData : null}
          populationRangeData={selectedLayers.includes('population') ? populationRangeData : null}
          landpricesubdData={selectedLayers.includes('landprice') ? landpricesubdData : null}
          landpricesubdRangeData={selectedLayers.includes('landprice') ? landpricesubdRangeData : null}
          landId={landId.toString()}
          isLoading={false}
        />
      </MapContainer>
    </div>
  );
}