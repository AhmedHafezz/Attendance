import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

export type GeoStatus = 'idle' | 'requesting' | 'locating' | 'locked' | 'denied' | 'error';

export interface GeoState {
  status: GeoStatus;
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  mocked?: boolean;
  errorMessage?: string;
}

export function useGeoLocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' });

  const acquireLocation = useCallback(async (): Promise<GeoState | null> => {
    setState({ status: 'requesting' });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      const denied: GeoState = { status: 'denied', errorMessage: 'Location permission denied.' };
      setState(denied);
      return null;
    }

    setState({ status: 'locating' });
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const next: GeoState = {
        status: 'locked',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        mocked: position.mocked ?? false,
      };
      setState(next);
      return next;
    } catch (err) {
      const failed: GeoState = { status: 'error', errorMessage: (err as Error).message };
      setState(failed);
      return null;
    }
  }, []);

  return { ...state, acquireLocation };
}
