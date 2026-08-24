import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { FaCrosshairs } from 'react-icons/fa';

// أيقونات Leaflet الافتراضية تعتمد على مسارات نسبية لا يعرفها المُجمّع،
// لذا نستوردها صراحةً حتى تظهر العلامة بعد البناء.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

function Recentre({ position }) {
  const map = useMap();

  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
  }, [map, position.lat, position.lng]);

  return null;
}

/**
 * منتقي موقع التوصيل.
 *
 * البلاطات من OpenStreetMap: مجانية ومفتوحة، بلا مفتاح ولا حساب.
 */
function AddressMap({ position, onChange, height = 300 }) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const markerHandlers = useMemo(
    () => ({
      dragend(event) {
        const { lat, lng } = event.target.getLatLng();
        onChange({ lat, lng });
      },
    }),
    [onChange]
  );

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location sharing.');
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError('We could not read your location. Drag the pin instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="address-map">
      <div className="address-map-canvas" style={{ height }}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <Marker
            position={[position.lat, position.lng]}
            draggable
            eventHandlers={markerHandlers}
          />

          <MapClickHandler onPick={onChange} />
          <Recentre position={position} />
        </MapContainer>
      </div>

      <div className="address-map-tools">
        <button type="button" onClick={useMyLocation} disabled={locating}>
          <FaCrosshairs aria-hidden="true" />
          {locating ? 'Locating…' : 'Use my location'}
        </button>

        <span className="address-map-coords">
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </span>
      </div>

      <p className="address-map-hint">
        Drag the pin or tap the map to mark your exact door.
      </p>

      {locationError ? (
        <p className="address-map-error" role="alert">
          {locationError}
        </p>
      ) : null}
    </div>
  );
}

export default AddressMap;
