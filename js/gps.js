const EARTH_RADIUS_M = 6371000;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class GpsTracker {
  constructor() {
    this.watchId = null;
    this.positions = [];
    this.totalMeters = 0;
    this.lastPosition = null;
    this.error = null;
    this.active = false;
  }

  start(onUpdate) {
    if (!navigator.geolocation) {
      this.error = 'GPS not supported on this device';
      onUpdate?.(this.getState());
      return;
    }

    this.positions = [];
    this.totalMeters = 0;
    this.lastPosition = null;
    this.error = null;
    this.active = true;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const point = { latitude, longitude, accuracy, timestamp: pos.timestamp };

        if (this.lastPosition) {
          const segment = haversineMeters(
            this.lastPosition.latitude,
            this.lastPosition.longitude,
            latitude,
            longitude
          );
          // Ignore GPS jumps (poor accuracy or teleport)
          if (segment < 50 && accuracy < 40) {
            this.totalMeters += segment;
          }
        }

        this.lastPosition = point;
        this.positions.push(point);
        onUpdate?.(this.getState());
      },
      (err) => {
        this.error = err.message;
        onUpdate?.(this.getState());
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );
  }

  stop() {
    if (this.watchId != null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.active = false;
  }

  getState() {
    return {
      totalMeters: this.totalMeters,
      totalMiles: this.totalMeters / 1609.344,
      totalKm: this.totalMeters / 1000,
      positionCount: this.positions.length,
      error: this.error,
      active: this.active,
    };
  }

  getTrack() {
    return this.positions.map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
      t: p.timestamp,
    }));
  }
}

export function formatDistance(meters, unit = 'mi') {
  if (unit === 'km') {
    return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
  }
  const miles = meters / 1609.344;
  if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
  return `${miles.toFixed(2)} mi`;
}
