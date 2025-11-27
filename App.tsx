import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Contact, Settings, SosEvent } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import ContactList from './components/ContactList';
import ContactForm from './components/ContactForm';
import { ShieldIcon, UserIcon, SettingsIcon, HistoryIcon, BellIcon, ChartBarIcon } from './components/icons/IconComponents';
import SettingsScreen from './components/SettingsScreen';
import HistoryScreen from './components/HistoryScreen';
import StatisticsScreen from './components/StatisticsScreen';

type View = 'SOS' | 'CONTACTS' | 'SETTINGS' | 'HISTORY' | 'STATISTICS';

const SosStatusBanner = ({ onCancel, onSafe, location }: { onCancel: () => void, onSafe: () => void, location: GeolocationCoordinates | null }) => (
  <div className="flex flex-col items-center text-center p-4 bg-red-900/50 border-b-2 border-red-500 shadow-lg">
    <h2 className="text-2xl font-bold text-red-400 mb-2 animate-pulse">SOS ACTIVATED</h2>
    <p className="text-red-200 text-sm mb-3">Alerts sent. Location tracking & audio recording active.</p>
    {location && (
      <div className="bg-gray-800 p-2 rounded-lg mb-3 w-full max-w-sm">
        <p className="text-xs text-gray-400">Current Location:</p>
        <p className="text-sm text-white font-mono">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</p>
      </div>
    )}
    <div className="w-full max-w-sm space-y-2">
      <button
        onClick={onSafe}
        className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-full text-lg shadow-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-4 focus:ring-green-400"
      >
        I AM SAFE
      </button>
      <button
        onClick={onCancel}
        className="w-full px-4 py-2 bg-transparent border-2 border-red-500 text-red-300 font-bold rounded-full text-md shadow-lg hover:bg-red-500/20 transition-colors focus:outline-none focus:ring-4 focus:ring-red-400"
      >
        Cancel Silently
      </button>
    </div>
  </div>
);

export default function App() {
  const [contacts, setContacts] = useLocalStorage<Contact[]>('sos-contacts', []);
  const defaultSettings: Settings = { tapCount: 3, tapTimeout: 500, gestureEnable: true, gestureSensitivity: 50 };
  const [settings, setSettings] = useLocalStorage<Settings>('sos-settings', defaultSettings);
  const [history, setHistory] = useLocalStorage<SosEvent[]>('sos-history', []);
  const [view, setView] = useState<View>('SOS');
  const [isSosActive, setIsSosActive] = useState(false);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tapCount = useRef(0);
  const tapTimer = useRef<number | null>(null);
  const locationWatchId = useRef<number | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const lastShakeTime = useRef(0);

  const addContact = (contact: Omit<Contact, 'id'>) => {
    setContacts(prev => [...prev, { ...contact, id: Date.now().toString() }]);
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };
  
  const addHistoryEvent = useCallback((type: 'tap' | 'gesture') => {
    // Get a single location snapshot for the history event
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newEvent: SosEvent = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: type,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        };
        setHistory(prev => [newEvent, ...prev]);
      },
      () => {
        // If location fails, log the event without it
        const newEvent: SosEvent = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: type,
        };
        setHistory(prev => [newEvent, ...prev]);
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
    );
  }, [setHistory]);

  const startAudioCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = event => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.start();
      console.log('Audio recording started.');
    } catch (err) {
      console.error('Error starting audio capture:', err);
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setError("Microphone permission denied. To enable audio recording, please go to your browser's site settings and grant access.");
      } else {
        setError('Could not access the microphone. Please ensure it is connected and not in use by another application.');
      }
    }
  }, []);

  const stopAudioCapture = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      console.log('Audio recording stopped.');
      audioChunks.current = [];
    }
  }, []);
  
  const startLocationTracking = useCallback(() => {
    if (navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setLocation(position.coords);
          console.log('Location updated:', position.coords);
        },
        (err) => {
          console.error('Error getting location:', err);
          if (err.code === 1) { // PERMISSION_DENIED
            setError("Location permission denied. To enable location tracking, please go to your browser's site settings and grant access.");
          } else if (err.code === 2) { // POSITION_UNAVAILABLE
            setError("Unable to determine your location. Please check your device's location services and network connection.");
          } else {
            setError('Could not get location. Please enable location services.');
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, []);
  
  const stopLocationTracking = useCallback(() => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
  }, []);

  const sendAlerts = useCallback((coords: GeolocationCoordinates) => {
    if (contacts.length === 0) {
      console.warn('SOS triggered, but no emergency contacts are set.');
      setError('No emergency contacts to alert.');
      return;
    }
    const googleMapsLink = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
    const message = `EMERGENCY! I need help. My current location is: ${googleMapsLink}`;

    contacts.forEach(contact => {
      console.log(`-- SIMULATING ALERT --`);
      console.log(`To: ${contact.name} (${contact.phone})`);
      console.log(`Message: ${message}`);
      console.log(`----------------------`);
    });

  }, [contacts]);

  const sendSafeMessage = useCallback(() => {
    if (contacts.length === 0) {
        console.warn('"I am safe" clicked, but no emergency contacts are set.');
        return;
    }
    const message = "UPDATE: I am safe now. The previous SOS alert was a false alarm. No need to worry.";

    contacts.forEach(contact => {
        console.log(`-- SIMULATING 'I AM SAFE' ALERT --`);
        console.log(`To: ${contact.name} (${contact.phone})`);
        console.log(`Message: ${message}`);
        console.log(`-----------------------------------`);
    });
  }, [contacts]);


  const triggerSOS = useCallback((type: 'tap' | 'gesture') => {
    if(isSosActive) return;
    console.log(`SOS TRIGGERED by ${type}`);
    setIsSosActive(true);
    setError(null);
    addHistoryEvent(type);
    startLocationTracking();
    startAudioCapture();
  }, [isSosActive, addHistoryEvent, startLocationTracking, startAudioCapture]);

  useEffect(() => {
    if(isSosActive && location) {
        sendAlerts(location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSosActive, location]);

  const cancelSOS = useCallback(() => {
    console.log('SOS CANCELLED');
    setIsSosActive(false);
    setError(null);
    setLocation(null);
    stopLocationTracking();
    stopAudioCapture();
  }, [stopLocationTracking, stopAudioCapture]);

  const handleSafeAndCancel = useCallback(() => {
    console.log('"I AM SAFE" CLICKED');
    sendSafeMessage();
    cancelSOS();
  }, [sendSafeMessage, cancelSOS]);

  const handleSosTap = useCallback(() => {
    if (isSosActive) return;

    tapCount.current += 1;

    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    if (tapCount.current >= settings.tapCount) {
      triggerSOS('tap');
      tapCount.current = 0;
      tapTimer.current = null;
    } else {
      tapTimer.current = window.setTimeout(() => {
        tapCount.current = 0;
      }, settings.tapTimeout);
    }
  }, [isSosActive, triggerSOS, settings.tapCount, settings.tapTimeout]);

  // Gesture detection effect
  useEffect(() => {
    if (!settings.gestureEnable || isSosActive) return;

    const handleMotionEvent = (event: DeviceMotionEvent) => {
        const now = Date.now();
        if (now - lastShakeTime.current < 3000) return; // 3s cooldown to prevent multiple triggers

        const { acceleration } = event;
        if (acceleration && acceleration.x && acceleration.y && acceleration.z) {
            const magnitude = Math.sqrt(acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2);
            
            // Refined sensitivity mapping for more granular control.
            // A higher threshold means a more forceful shake is required (less sensitive).
            const MAX_THRESHOLD = 40; // For sensitivity 0 (requires a very strong shake)
            const MIN_THRESHOLD = 12; // For sensitivity 100 (triggers on a moderate shake)

            // Map the user's sensitivity setting (0-100) to the inverted threshold range.
            // 0 sensitivity = MAX_THRESHOLD (hardest to trigger)
            // 100 sensitivity = MIN_THRESHOLD (easiest to trigger)
            const threshold = MAX_THRESHOLD - (settings.gestureSensitivity / 100) * (MAX_THRESHOLD - MIN_THRESHOLD);

            if (magnitude > threshold) {
                lastShakeTime.current = now;
                triggerSOS('gesture');
            }
        }
    };

    window.addEventListener('devicemotion', handleMotionEvent);
    return () => {
        window.removeEventListener('devicemotion', handleMotionEvent);
    };
  }, [settings.gestureEnable, settings.gestureSensitivity, isSosActive, triggerSOS]);

  const MainScreen = ({ isSosActive }: { isSosActive: boolean }) => {
    const tapInstruction = `Tap the shield ${settings.tapCount} times`;
    const gestureInstruction = settings.gestureEnable ? " or shake your phone" : "";

    return (
    <div className="flex flex-col flex-1 min-h-0">
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {view === 'SOS' && (
          <div className="flex flex-col items-center justify-center text-center flex-grow px-4">
              {!isSosActive && settings.gestureEnable && (
                <div className="absolute top-0 left-0 right-0 bg-green-600/20 text-green-300 flex items-center justify-center p-2 text-sm font-medium">
                  <BellIcon className="w-5 h-5 mr-2" />
                  Shake activation is armed
                </div>
              )}
            
            <h1 className="text-3xl font-bold text-gray-200 mb-2 mt-12">Silent SOS Beacon</h1>
            <p className="text-gray-400 mb-4 max-w-xs h-10 flex items-center justify-center">
              {isSosActive
                ? 'SOS is active. Cancel from the banner above.'
                : `${tapInstruction}${gestureInstruction} to send a silent alert.`
              }
            </p>

            <div className={`flex flex-col items-center mb-8 ${isSosActive ? 'opacity-50' : ''}`}>
                <p className="font-medium text-gray-300 mb-2">Shake Activation</p>
                <div className="flex items-center space-x-3">
                    <span className={`font-medium transition-colors ${!settings.gestureEnable ? 'text-white' : 'text-gray-500'}`}>OFF</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.gestureEnable}
                        onChange={(e) => setSettings(prev => ({...prev, gestureEnable: e.target.checked}))}
                        className="sr-only peer"
                        disabled={isSosActive}
                    />
                    <div className="w-14 h-7 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                    <span className={`font-medium transition-colors ${settings.gestureEnable ? 'text-white' : 'text-gray-500'}`}>ON</span>
                </div>
            </div>

            <div
              onClick={!isSosActive ? handleSosTap : undefined}
              className={`relative w-64 h-64 rounded-full flex items-center justify-center bg-gray-800 select-none shadow-2xl transition-all duration-300 ${isSosActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}`}
            >
              {!isSosActive && (
                <>
                  <div className="absolute inset-0 rounded-full bg-indigo-600/30 animate-pulse-slow"></div>
                  <div className="absolute inset-2 rounded-full bg-indigo-700/40 animate-pulse-medium"></div>
                </>
              )}
              <ShieldIcon className={`w-32 h-32 transition-colors ${isSosActive ? 'text-gray-600' : 'text-indigo-400'}`} />
            </div>
            {error && <p className="mt-8 text-red-400 bg-red-900/50 px-4 py-2 rounded-md">{error}</p>}
          </div>
        )}
        {view === 'CONTACTS' && (
          <div className="flex flex-col h-full p-4">
            <h1 className="text-3xl font-bold text-gray-200 text-center mb-6">Emergency Contacts</h1>
            <div className="flex-grow overflow-y-auto pr-2">
                <ContactList contacts={contacts} onDelete={deleteContact} />
            </div>
            <div className="mt-auto pt-4">
                <ContactForm onAdd={addContact} />
            </div>
          </div>
        )}
        {view === 'SETTINGS' && (
          <div className="p-4">
            <SettingsScreen settings={settings} onSettingsChange={setSettings} />
          </div>
        )}
        {view === 'HISTORY' && (
          <div className="p-4">
            <HistoryScreen history={history} />
          </div>
        )}
        {view === 'STATISTICS' && (
            <div className="p-4">
                <StatisticsScreen history={history} />
            </div>
        )}
      </main>

      <footer className="w-full bg-gray-900 border-t border-gray-700 p-2 sticky bottom-0">
        <nav className="flex justify-around">
          <button
            onClick={() => setView('SOS')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-1/5 ${view === 'SOS' ? 'text-indigo-400 bg-gray-800' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <ShieldIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">SOS</span>
          </button>
          <button
            onClick={() => setView('CONTACTS')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-1/5 ${view === 'CONTACTS' ? 'text-indigo-400 bg-gray-800' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <UserIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Contacts ({contacts.length})</span>
          </button>
          <button
            onClick={() => setView('SETTINGS')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-1/5 ${view === 'SETTINGS' ? 'text-indigo-400 bg-gray-800' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <SettingsIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Settings</span>
          </button>
          <button
            onClick={() => setView('HISTORY')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-1/5 ${view === 'HISTORY' ? 'text-indigo-400 bg-gray-800' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <HistoryIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">History</span>
          </button>
          <button
            onClick={() => setView('STATISTICS')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-1/5 ${view === 'STATISTICS' ? 'text-indigo-400 bg-gray-800' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <ChartBarIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Stats</span>
          </button>
        </nav>
      </footer>
    </div>
  );
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-white font-sans overflow-hidden">
      <div className="max-w-md mx-auto h-full bg-gray-800 shadow-2xl flex flex-col">
        {isSosActive && <SosStatusBanner onCancel={cancelSOS} onSafe={handleSafeAndCancel} location={location} />}
        <MainScreen isSosActive={isSosActive} />
      </div>
    </div>
  );
}