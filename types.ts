export interface Contact {
  id: string;
  name: string;
  phone: string;
}

export interface Settings {
  tapCount: number;
  tapTimeout: number;
  gestureEnable: boolean;
  gestureSensitivity: number; // 0-100
}

export interface SosEvent {
  id: string;
  timestamp: number;
  type: 'tap' | 'gesture';
  location?: {
    latitude: number;
    longitude: number;
  };
}
