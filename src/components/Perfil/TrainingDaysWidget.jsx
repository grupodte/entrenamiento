import React from 'react';
import { FaFire, FaCalendarAlt } from 'react-icons/fa';

const TrainingDaysWidget = ({ trainingDays = [] }) => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    // Nombres de los días de la semana
    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    
    // Generar array de días del mes actual
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(currentYear, currentMonth, i + 1);
        const dateStr = date.toISOString().split('T')[0]; // formato YYYY-MM-DD
        const trained = trainingDays.includes(dateStr);
        const isToday = i + 1 === currentDay;
        const isPast = i + 1 < currentDay;
        return { day: i + 1, trained, isToday, isPast };
    });

    // Calcular racha actual
    const currentStreak = trainingDays.length;
    const monthName = today.toLocaleDateString('es-ES', { month: 'long' });

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-700/30">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                        <FaCalendarAlt className="text-green-400 text-sm" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white capitalize">{monthName}</h3>
                        <p className="text-xs text-gray-400">{currentStreak} entrenamientos</p>
                    </div>
                </div>
                <div className="flex items-center space-x-1 bg-orange-500/20 px-2 py-1 rounded-full">
                    <FaFire className="text-orange-400 text-xs" />
                    <span className="text-orange-400 text-xs font-bold">{currentStreak}</span>
                </div>
            </div>
            
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((dayName, index) => (
                    <div key={index} className="text-center text-xs text-gray-500 font-medium py-1">
                        {dayName}
                    </div>
                ))}
            </div>
            
            {/* Calendario */}
            <div className="grid grid-cols-7 gap-1">
                {daysArray.map(({ day, trained, isToday, isPast }) => {
                    let className = "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200";
                    
                    if (trained) {
                        className += " bg-green-500 text-white shadow-md";
                    } else if (isToday) {
                        className += " bg-cyan-500/20 text-cyan-400 border border-cyan-400/50";
                    } else if (isPast) {
                        className += " bg-gray-700/50 text-gray-500";
                    } else {
                        className += " bg-gray-700/30 text-gray-400";
                    }
                    
                    return (
                        <div key={day} className={className}>
                            {day}
                        </div>
                    );
                })}
            </div>
            
            {/* Leyenda */}
            <div className="flex items-center justify-center space-x-4 mt-3 pt-3 border-t border-gray-700/50">
                <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-xs text-gray-400">Entrenado</span>
                </div>
                <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-cyan-500/50 rounded-full border border-cyan-400" />
                    <span className="text-xs text-gray-400">Hoy</span>
                </div>
            </div>
        </div>
    );
};

export default TrainingDaysWidget;
