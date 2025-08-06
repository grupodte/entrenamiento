import React from 'react';
import WeightChartCard from './WeightChartCard';
import RepsChartCard from './RepsChartCard';
import TimeChartCard from './TimeChartCard';
import TrainingDaysWidget from './TrainingDaysWidget';

const WorkoutStats = ({ weightData, repsData, timeData, loadingCharts, trainingDays }) => {
    return (
        <div className="space-y-4">
            {loadingCharts ? (
                <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">Cargando estadísticas...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <WeightChartCard weightDailyData={weightData} loading={loadingCharts} />
                        <TrainingDaysWidget trainingDays={trainingDays} />
                    </div>
                    <RepsChartCard repsData={repsData} />
                    <TimeChartCard timeData={timeData} />
                </>
            )}
        </div>
    );
};

export default WorkoutStats;
