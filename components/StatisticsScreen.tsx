import React, { useMemo } from 'react';
import { SosEvent } from '../types';
import { ChartBarIcon, TapIcon, VibrateIcon } from './icons/IconComponents';

interface StatisticsScreenProps {
  history: SosEvent[];
}

const StatCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-gray-700 p-4 rounded-lg ${className}`}>
    <h2 className="text-xl font-semibold text-indigo-300 mb-3">{title}</h2>
    {children}
  </div>
);

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ history }) => {
  const stats = useMemo(() => {
    if (history.length === 0) {
      return null;
    }

    const totalEvents = history.length;
    const tapEvents = history.filter(e => e.type === 'tap').length;
    const gestureEvents = history.filter(e => e.type === 'gesture').length;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const eventsByDay = days.map(() => 0);
    history.forEach(event => {
      const dayIndex = new Date(event.timestamp).getDay();
      eventsByDay[dayIndex]++;
    });

    return {
      totalEvents,
      tapEvents,
      gestureEvents,
      eventsByDay,
    };
  }, [history]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-3xl font-bold text-gray-200 mb-4">SOS Statistics</h1>
        <p className="text-gray-400">No SOS event data available to generate statistics.</p>
      </div>
    );
  }

  const maxDayEvents = Math.max(...stats.eventsByDay);

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold text-gray-200 text-center mb-6">SOS Statistics</h1>
      <div className="space-y-4">
        <StatCard title="Total Activations">
          <p className="text-5xl font-bold text-white">{stats.totalEvents}</p>
          <p className="text-gray-400">Total SOS events triggered</p>
        </StatCard>

        <StatCard title="Activation Methods">
          <div className="space-y-3">
            <div className="flex items-center">
              <TapIcon className="w-6 h-6 mr-3 text-indigo-300" />
              <span className="w-20 text-gray-300">Tap</span>
              <span className="font-semibold text-white">{stats.tapEvents}</span>
            </div>
            <div className="flex items-center">
              <VibrateIcon className="w-6 h-6 mr-3 text-indigo-300" />
              <span className="w-20 text-gray-300">Gesture</span>
              <span className="font-semibold text-white">{stats.gestureEvents}</span>
            </div>
          </div>
        </StatCard>
        
        <StatCard title="Weekly Trends">
            <p className="text-sm text-gray-400 mb-4">Activations by day of the week.</p>
            <div className="space-y-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="flex items-center text-sm">
                        <span className="w-10 font-medium text-gray-300">{day}</span>
                        <div className="flex-1 bg-gray-600 rounded-full h-4 mr-2">
                            <div
                                className="bg-indigo-500 h-4 rounded-full"
                                style={{ width: maxDayEvents > 0 ? `${(stats.eventsByDay[index] / maxDayEvents) * 100}%` : '0%' }}
                            ></div>
                        </div>
                        <span className="w-8 font-semibold text-white text-right">{stats.eventsByDay[index]}</span>
                    </div>
                ))}
            </div>
        </StatCard>
      </div>
    </div>
  );
};

export default StatisticsScreen;
