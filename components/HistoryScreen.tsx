import React from 'react';
import { SosEvent } from '../types';
import { ClockIcon, LocationMarkerIcon, TapIcon, VibrateIcon } from './icons/IconComponents';

interface HistoryScreenProps {
  history: SosEvent[];
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-3xl font-bold text-gray-200 mb-4">SOS History</h1>
        <p className="text-gray-400">No SOS events recorded yet.</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const EventIcon = ({ type }: { type: 'tap' | 'gesture' }) => {
    const iconProps = { className: "w-6 h-6 text-indigo-300" };
    if (type === 'gesture') {
      return <div className="p-3 bg-gray-600 rounded-full"><VibrateIcon {...iconProps} /></div>;
    }
    return <div className="p-3 bg-gray-600 rounded-full"><TapIcon {...iconProps} /></div>;
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold text-gray-200 text-center mb-6">SOS History</h1>
      <div className="flex-grow overflow-y-auto pr-2">
        <ul className="space-y-4">
          {history.map((event) => (
            <li
              key={event.id}
              className="flex items-start space-x-4 bg-gray-700 p-4 rounded-lg shadow"
            >
              <EventIcon type={event.type} />
              <div className="flex-1">
                <p className="font-bold text-lg text-white capitalize">{event.type} Activation</p>
                <div className="flex items-center text-sm text-gray-400 mt-1">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  <span>{formatTimestamp(event.timestamp)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <LocationMarkerIcon className="w-4 h-4 mr-2" />
                    <span>{event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HistoryScreen;
