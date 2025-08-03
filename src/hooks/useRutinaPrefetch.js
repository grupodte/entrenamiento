import { useEffect } from 'react';
import { useRutinaCache } from './useRutinaCache';

export const useRutinaPrefetch = (rutinas) => {
    const { fetchRutinaData } = useRutinaCache();

    useEffect(() => {
        // Prefetch rutinas que es probable que el usuario abra
        const prefetchRutinas = async () => {
            if (!rutinas || rutinas.length === 0) return;

            // Obtener el día de hoy
            const todayIndex = (new Date().getDay() + 6) % 7; // Lunes = 0
            
            // Rutina de hoy (alta prioridad)
            const rutinaHoy = rutinas.find(r => r.dia === todayIndex);
            if (rutinaHoy && !rutinaHoy.isCompleted) {
                setTimeout(() => {
                    fetchRutinaData(
                        rutinaHoy.rutinaId.replace(/^[pb]-/, ''), 
                        rutinaHoy.tipo
                    ).catch(() => {}); // Silenciar errores en prefetch
                }, 1000); // Delay para no interferir con la carga inicial
            }

            // Próximas rutinas (baja prioridad)
            const proximasRutinas = rutinas
                .filter(r => r.dia !== todayIndex)
                .slice(0, 2); // Solo las próximas 2

            proximasRutinas.forEach((rutina, index) => {
                setTimeout(() => {
                    fetchRutinaData(
                        rutina.rutinaId.replace(/^[pb]-/, ''), 
                        rutina.tipo
                    ).catch(() => {}); // Silenciar errores en prefetch
                }, 2000 + (index * 1000)); // Staggered prefetch
            });
        };

        prefetchRutinas();
    }, [rutinas, fetchRutinaData]);
};
