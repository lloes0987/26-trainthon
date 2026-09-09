export type NaverLatLng = {
  x: number;
  y: number;
  lat: () => number;
  lng: () => number;
};

export type NaverMapInstance = {
  setCenter: (latlng: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: unknown, margin?: unknown) => void;
};

export type NaverMarkerInstance = {
  setMap: (map: NaverMapInstance | null) => void;
};

declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (
          el: HTMLElement | string,
          options?: Record<string, unknown>,
        ) => NaverMapInstance;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (options: Record<string, unknown>) => NaverMarkerInstance;
        Point: new (x: number, y: number) => unknown;
        Size: new (width: number, height: number) => unknown;
        LatLngBounds: new (sw?: NaverLatLng, ne?: NaverLatLng) => {
          extend: (latlng: NaverLatLng) => void;
        };
        Position: { TOP_RIGHT: unknown };
        Event: {
          addListener: (
            target: object,
            event: string,
            handler: (e: { coord: NaverLatLng }) => void,
          ) => unknown;
        };
        Service: {
          Status: { OK: string };
          OrderType: { ROAD_ADDR: string; ADDR: string };
          geocode: (
            options: { query: string },
            callback: (
              status: string,
              response: {
                v2?: {
                  addresses?: Array<{
                    x: string;
                    y: string;
                    roadAddress?: string;
                    jibunAddress?: string;
                  }>;
                };
              },
            ) => void,
          ) => void;
          reverseGeocode: (
            options: { coords: NaverLatLng; orders?: string },
            callback: (
              status: string,
              response: {
                v2?: {
                  address?: {
                    roadAddress?: string;
                    jibunAddress?: string;
                  };
                };
              },
            ) => void,
          ) => void;
        };
      };
    };
  }
}
