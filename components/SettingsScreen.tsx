import React from 'react';
import { Settings } from '../types';

interface SettingsScreenProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSettingsChange }) => {

  const handleTapCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, tapCount: parseInt(e.target.value, 10) });
  };

  const handleTapTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, tapTimeout: parseInt(e.target.value, 10) });
  };
  
  const handleGestureSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, gestureSensitivity: parseInt(e.target.value, 10) });
  };

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold text-gray-200 text-center mb-6">SOS Settings</h1>
      <div className="space-y-6">
        {/* Tap Settings */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-indigo-300 mb-3">Tap Activation</h2>
          <div>
            <label htmlFor="tapCount" className="block text-base font-medium text-gray-300 mb-2">
              Activation Taps
            </label>
            <div className="flex items-center space-x-4">
              <input
                id="tapCount"
                type="range"
                min="2"
                max="5"
                value={settings.tapCount}
                onChange={handleTapCountChange}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xl font-semibold text-white bg-gray-800 w-12 text-center py-1 rounded-md">
                {settings.tapCount}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Number of quick taps on the shield to trigger an alert.
            </p>
          </div>
          <div className="mt-4">
            <label htmlFor="tapTimeout" className="block text-base font-medium text-gray-300 mb-2">
              Tap Sensitivity (ms)
            </label>
            <div className="flex items-center space-x-4">
              <input
                id="tapTimeout"
                type="range"
                min="300"
                max="1000"
                step="50"
                value={settings.tapTimeout}
                onChange={handleTapTimeoutChange}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-xl font-semibold text-white bg-gray-800 w-16 text-center py-1 rounded-md">
                {settings.tapTimeout}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Maximum time between taps. Lower is faster/more sensitive.
            </p>
          </div>
        </div>

        {/* Gesture Settings */}
        <div className="bg-gray-700 p-4 rounded-lg">
            <h2 className="text-xl font-semibold text-indigo-300 mb-3">Gesture Activation</h2>
             <p className="text-sm text-gray-400">
                You can enable or disable shake activation on the main SOS screen.
            </p>
            <div className={`mt-4 pt-4 border-t border-gray-600 transition-opacity ${!settings.gestureEnable ? 'opacity-50' : ''}`}>
                <label htmlFor="gestureSensitivity" className="block text-base font-medium text-gray-300 mb-2">
                Shake Sensitivity
                </label>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">Less</span>
                    <input
                        id="gestureSensitivity"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={settings.gestureSensitivity}
                        onChange={handleGestureSensitivityChange}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:accent-gray-500"
                        disabled={!settings.gestureEnable}
                    />
                      <span className="text-sm text-gray-400">More</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                    Adjust how much shaking is needed to trigger an alert.
                </p>
                {!settings.gestureEnable && (
                  <p className="text-sm text-yellow-400 bg-yellow-900/50 p-2 rounded-md mt-3">
                      Enable shake activation on the main SOS screen to use this setting.
                  </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
