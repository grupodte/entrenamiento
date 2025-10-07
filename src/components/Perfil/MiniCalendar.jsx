import React, { useMemo } from 'react';

const DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MiniCalendar = ({ trainingDays = [], className = '' }) => {
    const calendarData = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        
        // Primer día del mes
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        // Último día del mes
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        
        // Crear array de días para mostrar
        const calendarDays = [];
        
        // Agregar espacios vacíos para los días antes del primer día del mes
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarDays.push(null);
        }
        
        // Agregar todos los días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            calendarDays.push(day);
        }
        
        return {
            monthName: MESES[month],
            year,
            today,
            calendarDays,
            daysInMonth
        };
    }, []);
    
    // Convertir trainingDays a Set para búsqueda rápida
    const trainingDaysSet = useMemo(() => {
        return new Set(trainingDays.map(day => parseInt(day)));
    }, [trainingDays]);
    
    return (
        <div className={`bg-black border-none rounded-[10px] p-3 ${className}`}>
            {/* Header del calendario */}
            <div className="text-center mb-2">
                <h3 className="text-[15px] font-bold text-[#FF0000]">
                    {calendarData.monthName}
                </h3>
            </div>
            
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DIAS_SEMANA.map((dia, index) => (
                    <div key={index} className="px-2 text-left text-[15px]  text-[#FFFFFF] py-1">
                        {dia}
                    </div>
                ))}
            </div>
            
            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-0.5">
                {calendarData.calendarDays.map((day, index) => {
                    if (day === null) {
                        // Día vacío
                        return <div key={index} className="w-6 h-6"></div>;
                    }
                    
                    const isToday = day === calendarData.today;
                    const hasTraining = trainingDaysSet.has(day);
                    
                    return (
                        <div
                            key={index}
                            className={`
                                w-6 h-6 rounded-md flex items-center justify-center text-[15px] 
                                border-none
                                ${hasTraining 
                                ? 'bg-[#47D065] text-[#FFFFFF]  ' 
                                    : 'text-[#FFFFFF]/80 '
                                }
                                ${isToday 
                                ? 'ring-1 ring-[#47D065]' 
                                    : ''
                                }
                            `}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>
            
            
        </div>
    );
};

export default MiniCalendar;
