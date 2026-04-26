'use client';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { Rental } from './RentalCard';

const defaultCenter: [number, number] = [40.7128, -74.0060]; // NYC

function MapClickHandler({ onClick }: { onClick: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function RentalsMap({ rentals, onMarkerClick }: { rentals: Rental[], onMarkerClick?: (rental: Rental) => void }) {
  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={defaultCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {rentals.map(rental => (
          (rental.lat && rental.lng) ? (
            <Marker key={rental.id} position={[rental.lat, rental.lng]} eventHandlers={{ click: () => onMarkerClick?.(rental) }}>
              <Popup>
                <div className="p-1 max-w-[200px]">
                  <h4 className="font-bold text-sm mb-1 line-clamp-1">{rental.title}</h4>
                  <p className="text-violet-600 font-semibold mb-1">${rental.price}<span className="text-gray-500 font-normal text-xs">/mo</span></p>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1">{rental.location}</p>
                   {rental.photoUrls?.[0] && (
                     <div className="w-full h-24 bg-gray-100 rounded overflow-hidden">
                       <img src={rental.photoUrls[0]} alt="Property" className="w-full h-full object-cover" />
                     </div>
                   )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}

export function MapPicker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  return (
    <div className="h-[250px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
      <MapContainer center={position} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={setPosition} />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
}

export function SingleRentalMap({ rental }: { rental: Rental }) {
  if (!rental.lat || !rental.lng) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
        <p>Location not mapped</p>
      </div>
    );
  }
  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={[rental.lat, rental.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[rental.lat, rental.lng]} />
      </MapContainer>
    </div>
  );
}
