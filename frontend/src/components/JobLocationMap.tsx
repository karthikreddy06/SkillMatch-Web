import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Car, Bus, Footprints, ExternalLink, ShieldCheck } from 'lucide-react';
import { Job } from '../types';

interface JobLocationMapProps {
  mode?: 'single' | 'radar' | 'picker';
  job?: Job;
  jobs?: Job[];
  height?: string;
  userLat?: number;
  userLng?: number;
  initialLat?: number;
  initialLng?: number;
  onSelectJob?: (job: Job) => void;
  onCoordinatesChange?: (lat: number, lng: number, addressText?: string) => void;
  interactive?: boolean;
  showDirections?: boolean;
  onDirectionsStatus?: (status: 'idle' | 'requesting' | 'ready' | 'denied' | 'error') => void;
}

// City / Location coordinate resolver fallback for jobs that have string locations
// Haversine distance calculator in KM
export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const JobLocationMap: React.FC<JobLocationMapProps> = ({
  mode = 'single',
  job,
  jobs = [],
  height = '320px',
  userLat,
  userLng,
  initialLat,
  initialLng,
  onSelectJob,
  onCoordinatesChange,
  interactive = true,
  showDirections = false,
  onDirectionsStatus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [routeUser, setRouteUser] = useState<{ lat: number; lng: number } | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [directionStatus, setDirectionStatus] = useState<'idle' | 'requesting' | 'ready' | 'denied' | 'error'>('idle');
  const [locationRequestVersion, setLocationRequestVersion] = useState(0);

  useEffect(() => {
    if (!showDirections || mode !== 'single' || !job) {
      setRouteGeometry([]);
      setRouteInfo(null);
      setDirectionStatus('idle');
      onDirectionsStatus?.('idle');
      return;
    }

    if (!navigator.geolocation) {
      setDirectionStatus('error');
      onDirectionsStatus?.('error');
      return;
    }

    setDirectionStatus('requesting');
    setRouteUser(null);
    setRouteGeometry([]);
    setRouteInfo(null);
    onDirectionsStatus?.('requesting');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
      setRouteUser(origin);
      try {
        const destination = typeof job.latitude === 'number' && typeof job.longitude === 'number'
          ? { lat: job.latitude, lng: job.longitude }
          : null;
        if (!destination) throw new Error('Job workplace coordinates are unavailable');
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`);
        if (!response.ok) throw new Error('Routing service unavailable');
        const data = await response.json();
        const route = data.routes?.[0];
        if (!route?.geometry?.coordinates?.length) throw new Error('No route found');
        setRouteGeometry(route.geometry.coordinates);
        setRouteInfo({ distance: route.distance, duration: route.duration });
        setDirectionStatus('ready');
        onDirectionsStatus?.('ready');
      } catch (error) {
        console.error('Unable to calculate route:', error);
        setDirectionStatus('error');
        onDirectionsStatus?.('error');
      }
    }, (error) => {
      const status = error.code === error.PERMISSION_DENIED ? 'denied' : 'error';
      setDirectionStatus(status);
      onDirectionsStatus?.(status);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }, [showDirections, mode, job?.id, locationRequestVersion]);

  // Determine central point
  let targetLat = initialLat;
  let targetLng = initialLng;

  if (mode === 'single' && job) {
    if (typeof job.latitude === 'number' && typeof job.longitude === 'number') {
      targetLat = job.latitude;
      targetLng = job.longitude;
    } else {
      targetLat = undefined;
      targetLng = undefined;
    }
  } else if (!targetLat || !targetLng) {
    targetLat = jobs.find((item) => typeof item.latitude === 'number' && typeof item.longitude === 'number')?.latitude;
    targetLng = jobs.find((item) => typeof item.latitude === 'number' && typeof item.longitude === 'number')?.longitude;
  }

  // Calculate distance for single job
  const effectiveUserLat = routeUser?.lat ?? userLat;
  const effectiveUserLng = routeUser?.lng ?? userLng;
  const distanceKm =
    targetLat && targetLng && effectiveUserLat !== undefined && effectiveUserLng !== undefined
      ? routeInfo ? Math.round(routeInfo.distance / 100) / 10 : calculateDistanceKm(effectiveUserLat, effectiveUserLng, targetLat, targetLng)
      : undefined;

  const driveMins = distanceKm === undefined ? undefined : Math.max(4, Math.round(distanceKm * 2.8));
  const transitMins = distanceKm === undefined ? undefined : Math.max(8, Math.round(distanceKm * 4.5));
  const walkMins = distanceKm === undefined ? undefined : Math.round(distanceKm * 12);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const zoomLevel = mode === 'picker' ? 14 : mode === 'radar' ? 12 : 13;
    if (targetLat === undefined || targetLng === undefined) return;
    const map = L.map(mapContainerRef.current, {
      center: [targetLat, targetLng],
      zoom: zoomLevel,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom CSS marker creator
    const createCustomIcon = (
      color: string,
      label: string,
      isUser: boolean = false,
      isVerified: boolean = false
    ) => {
      return L.divIcon({
        className: 'osm-custom-pin',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isUser ? '32px' : '38px'};
            height: ${isUser ? '32px' : '38px'};
            background: ${color};
            border-radius: 50% 50% 50% 4px;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 2px solid #FFFFFF;
            cursor: pointer;
          ">
            <span style="
              transform: rotate(45deg);
              color: #FFFFFF;
              font-weight: 800;
              font-size: ${isUser ? '11px' : '12px'};
              font-family: sans-serif;
            ">${label}</span>
            ${
              isVerified
                ? `<span style="
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    transform: rotate(45deg);
                    width: 14px;
                    height: 14px;
                    background: #0284C7;
                    border-radius: 50%;
                    border: 1px solid #FFF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    color: #FFF;
                  ">✓</span>`
                : ''
            }
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });
    };

    const userMarkers: L.Marker[] = [];

    // User's own location marker
    if (effectiveUserLat !== undefined && effectiveUserLng !== undefined) {
      const userIcon = createCustomIcon('linear-gradient(135deg, #10B981 0%, #059669 100%)', 'ME', true);
      const userMarker = L.marker([effectiveUserLat, effectiveUserLng], { icon: userIcon }).addTo(map);
      userMarkers.push(userMarker);
      userMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 13px; padding: 4px;">
        <strong style="color: #059669;">Your Reference Location</strong><br/>
        <span style="color: #4B5563; font-size: 11px;">Profile location</span>
      </div>
    `);
    }

    // MODE 1: SINGLE JOB VIEW
    if (mode === 'single' && job) {
      const jobIcon = createCustomIcon(
        'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        (job.company_name || 'J')[0].toUpperCase(),
        false,
        job.company_verified || true
      );

      const jobMarker = L.marker([targetLat, targetLng], { icon: jobIcon }).addTo(map);
      jobMarker
        .bindPopup(
          `
        <div style="font-family: sans-serif; padding: 6px; min-width: 180px;">
          <strong style="color: #1F2937; font-size: 14px;">${job.title}</strong><br/>
          <div style="color: #4F46E5; font-weight: 600; font-size: 12px; margin: 2px 0;">
            ${job.company_name} ${job.company_verified ? '✓' : ''}
          </div>
          <div style="color: #6B7280; font-size: 11px;">${job.location}</div>
          <div style="margin-top: 6px; font-weight: 700; color: #10B981; font-size: 12px;">
            ${job.salary_range || 'Competitive'}
          </div>
        </div>
      `
        )
        .openPopup();

      if (routeGeometry.length > 0) {
        const routeLayer = L.geoJSON({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeGeometry } } as GeoJSON.GeoJsonObject, {
          style: { color: '#6b5bdf', weight: 5, opacity: 0.88 },
        }).addTo(map);
        routeLayer.bringToFront();
      }

      // Draw 5km commute radius circle around job
      L.circle([targetLat, targetLng], {
        color: '#6366F1',
        fillColor: '#818CF8',
        fillOpacity: 0.12,
        radius: 5000,
        weight: 1.5,
        dashArray: '4, 6',
      }).addTo(map);

      // Fit bounds to show both user and job
      const routeBounds = routeGeometry.length ? L.geoJSON({ type: 'LineString', coordinates: routeGeometry } as GeoJSON.GeoJsonObject).getBounds() : null;
      const group = L.featureGroup([...userMarkers, jobMarker]);
      if (routeBounds?.isValid()) map.fitBounds(routeBounds.pad(0.15));
      else map.fitBounds(group.getBounds().pad(0.25));
    }

    // MODE 2: MULTI-JOB RADAR VIEW
    else if (mode === 'radar' && jobs.length > 0) {
      const markers: L.Marker[] = [...userMarkers];

      jobs.forEach((j) => {
        let lat = typeof j.latitude === 'number' ? j.latitude : undefined;
        let lng = typeof j.longitude === 'number' ? j.longitude : undefined;
        if (!lat || !lng) {
          return;
        }

        const score = j.match_score || 85;
        const pinColor =
          score >= 85
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)';

        const markerIcon = createCustomIcon(
          pinColor,
          `${score}%`,
          false,
          j.company_verified ?? true
        );

        if (lat === undefined || lng === undefined) return;
        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'sans-serif';
        popupContent.style.padding = '8px';
        popupContent.style.minWidth = '200px';
        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
            <strong style="color: #111827; font-size: 13px;">${j.title}</strong>
            <span style="background: #E0E7FF; color: #4338CA; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px;">
              ${score}% Match
            </span>
          </div>
          <div style="color: #4F46E5; font-size: 12px; font-weight: 600; margin: 3px 0;">
            ${j.company_name}
          </div>
          <div style="color: #6B7280; font-size: 11px; margin-bottom: 8px;">
            📍 ${j.location} • ${j.job_type}
          </div>
          <button id="view-job-btn-${j.id}" style="
            width: 100%;
            background: #4F46E5;
            color: #FFFFFF;
            border: none;
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">View Opportunity & Details →</button>
        `;

        // Handle button click in popup
        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-job-btn-${j.id}`);
          if (btn && onSelectJob) {
            btn.onclick = () => onSelectJob(j);
          }
        });

        markers.push(marker);
      });

      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    // MODE 3: LOCATION PICKER FOR POSTING JOBS
    else if (mode === 'picker') {
      const pickerIcon = createCustomIcon(
        'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
        'HQ',
        false,
        true
      );
      let pickerMarker = L.marker([targetLat, targetLng], {
        icon: pickerIcon,
        draggable: true,
      }).addTo(map);

      pickerMarker.bindPopup('Drag pin to position your exact workplace / office location').openPopup();

      pickerMarker.on('dragend', () => {
        const pos = pickerMarker.getLatLng();
        if (onCoordinatesChange) {
          onCoordinatesChange(pos.lat, pos.lng);
        }
      });

      map.on('click', (e) => {
        pickerMarker.setLatLng(e.latlng);
        if (onCoordinatesChange) {
          onCoordinatesChange(e.latlng.lat, e.latlng.lng);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mode, job?.id, jobs.length, targetLat, targetLng, effectiveUserLat, effectiveUserLng, routeGeometry]);

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
        background: 'rgba(15, 23, 42, 0.6)',
        position: 'relative',
      }}
      className="job-location-map-wrapper"
    >
      {/* Interactive Map Box */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: height,
          zIndex: 1,
        }}
        id="osm-leaflet-map-canvas"
      >
        {targetLat === undefined || targetLng === undefined ? <div className="map-location-unavailable">Exact coordinates unavailable. Select or save a real location first.</div> : null}
      </div>

      {/* Commute & Location Analysis Bar (Single Job Mode) */}
      {mode === 'single' && job && (
        <div
          style={{
            padding: '0.85rem 1.1rem',
            background: '#FFFFFF',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#4F46E5',
                fontWeight: 600,
              }}
            >
              <Navigation size={14} />
              <span>{directionStatus === 'requesting' ? 'Requesting your location...' : distanceKm !== undefined ? `${distanceKm} km from your location` : directionStatus === 'denied' ? 'Location access is disabled' : directionStatus === 'error' ? 'Unable to calculate a route right now' : 'Allow location to see directions'}</span>
            </div>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', color: 'var(--text-secondary)' }}>
              {routeInfo && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Estimated drive time">
                <Car size={13} color="#10B981" /> ~{Math.round(routeInfo.duration / 60)} min drive
              </span>}
              {distanceKm !== undefined && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Estimated transit time">
                <Bus size={13} color="#818CF8" /> ~{transitMins} min transit
              </span>}
              {distanceKm !== undefined && distanceKm <= 4 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Estimated walk time">
                  <Footprints size={13} color="#F59E0B" /> ~{walkMins} min walk
                </span>
              )}
            </div>
          </div>

          {(directionStatus === 'denied' || directionStatus === 'error') && <button className="btn btn-secondary btn-sm" onClick={() => setLocationRequestVersion((version) => version + 1)}>{directionStatus === 'denied' ? 'Enable Location' : 'Try Again'}</button>}

          {targetLat !== undefined && targetLng !== undefined && effectiveUserLat !== undefined && effectiveUserLng !== undefined && <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}${effectiveUserLat !== undefined && effectiveUserLng !== undefined ? `&origin=${effectiveUserLat},${effectiveUserLng}` : ''}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#4F46E5' }}
          >
            <span>Open Directions</span>
            <ExternalLink size={12} />
          </a>}
        </div>
      )}
    </div>
  );
};
