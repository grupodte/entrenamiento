import React from 'react';

const TrainingDaysWidget = ({ trainingDays = [] }) => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Generar array de días del mes actual
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(currentYear, currentMonth, i + 1);
        const dateStr = date.toISOString().split('T')[0]; // formato YYYY-MM-DD
        const trained = trainingDays.includes(dateStr);
        return { day: i + 1, trained };
    });

    return (
        <div className="bg-gray-700/20 backdrop-blur-sm rounded-lg p-3 shadow-md">
            <h3 className="text-xs font-semibold text-white mb-2">Entrenamientos del mes</h3>
            <div className="grid grid-cols-7 gap-2">
                {daysArray.map(({ day, trained }) => (
                    <div
                        key={day}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] 
                ${trained ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-400'}`}
                    >
                        {day}
                    </div>
                ))}
            </div>

        </div>
    );
};

export default TrainingDaysWidget;
