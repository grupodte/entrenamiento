import React from 'react';
import WeightChartCard from './WeightChartCard';
import RepsChartCard from './RepsChartCard';
import TimeChartCard from './TimeChartCard';
import TrainingDaysWidget from './TrainingDaysWidget';
import { FaFire, FaTrophy, FaChartLine, FaClock } from 'react-icons/fa';

// Componente para estadísticas destacadas estilo red social
const StatHighlight = ({ icon, title, value, subtitle, gradient = 'from-cyan-500 to-blue-600' }) => (
    <div className={`bg-gradient-to-r ${gradient} p-4 rounded-2xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 opacity-20">
            <div className="text-4xl text-white">{icon}</div>
        </div>
        <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
                <span className="text-white/80">{icon}</span>
                <h3 className="text-white font-medium text-sm">{title}</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-white/70 text-xs">{subtitle}</div>
        </div>
    </div>
);

const WorkoutStats = ({ weightData, repsData, timeData, loadingCharts, trainingDays }) => {
    // Calcular estadísticas generales
    const totalWorkouts = trainingDays?.length || 0;
    const totalWeight = weightData?.reduce((sum, item) => sum + (item.carga || 0), 0) || 0;
    const avgReps = repsData?.length > 0 
        ? (repsData.reduce((sum, item) => sum + (item.repeticiones || 0), 0) / repsData.length).toFixed(0)
        : 0;
    const totalTime = timeData?.reduce((sum, item) => sum + (item.duracion || 0), 0) || 0;
    const avgTime = timeData?.length > 0 ? Math.round(totalTime / timeData.length) : 0;

    return (
        <div className="space-y-6">
            {loadingCharts ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                    <p className="text-gray-400 text-sm mt-2">Cargando estadísticas...</p>
                </div>
            ) : (
                <>
                    {/* Estadísticas Destacadas */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full" />
                            <h2 className="text-lg font-bold text-white">Estadísticas de Entrenamiento</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <StatHighlight
                                icon={<FaFire />}
                                title="Entrenamientos"
                                value={totalWorkouts}
                                subtitle="este mes"
                                gradient="from-orange-500 to-red-600"
                            />
                            <StatHighlight
                                icon={<FaTrophy />}
                                title="Peso Total"
                                value={`${totalWeight.toFixed(0)} kg`}
                                subtitle="levantado"
                                gradient="from-yellow-500 to-orange-600"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <StatHighlight
                                icon={<FaChartLine />}
                                title="Reps Promedio"
                                value={avgReps}
                                subtitle="por ejercicio"
                                gradient="from-green-500 to-teal-600"
                            />
                            <StatHighlight
                                icon={<FaClock />}
                                title="Tiempo Promedio"
                                value={`${avgTime} min`}
                                subtitle="por sesión"
                                gradient="from-purple-500 to-indigo-600"
                            />
                        </div>
                    </div>

                    {/* Detalles de Entrenamiento */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-cyan-500 rounded-full" />
                            <h2 className="text-lg font-bold text-white">Detalles de Progreso</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <WeightChartCard weightDailyData={weightData} loading={loadingCharts} />
                            <TrainingDaysWidget trainingDays={trainingDays} />
                            <RepsChartCard repsData={repsData} />
                            <TimeChartCard timeData={timeData} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkoutStats;
