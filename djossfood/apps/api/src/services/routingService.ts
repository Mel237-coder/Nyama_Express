import axios from 'axios';

interface RouteResult {
  distance_km: number;
  duration_min: number;
  polyline: string;
}

export class RoutingService {
  private apiKey = process.env.GOOGLE_MAPS_API_KEY;

  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteResult | null> {
    if (!this.apiKey) return null;

    try {
      const { data } = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${originLat},${originLng}`,
            destination: `${destLat},${destLng}`,
            key: this.apiKey,
            language: 'fr',
          },
        },
      );

      const route = data.routes?.[0]?.legs?.[0];
      if (!route) return null;

      return {
        distance_km: Math.round((route.distance.value / 1000) * 100) / 100,
        duration_min: Math.ceil(route.duration.value / 60),
        polyline: data.routes[0].overview_polyline.points,
      };
    } catch {
      return null;
    }
  }
}