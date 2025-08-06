import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useWorkoutData = (userId, isOpen) => {
    const [weightData, setWeightData] = useState([]);
    const [repsData, setRepsData] = useState([]);
    const [timeData, setTimeData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !userId) {
            return;
        }

        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const fetchWorkoutData = async () => {
            setLoadingCharts(true);

            // Crear nuevo AbortController
            abortControllerRef.current = new AbortController();

            try {
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);

                // Optimización: Una sola consulta con JOIN
                const { data: workoutData, error } = await supabase
                    .from('sesiones_entrenamiento')
                    .select(`
            id,
            created_at,
            duracion_segundos,
            sesiones_series (
              carga_realizada,
              reps_realizadas
            )
          `)
                    .eq('alumno_id', userId)
                    .gte('created_at', thirtyDaysAgo.toISOString())
                    .order('created_at', { ascending: true });

                // Verificar si la operación fue cancelada
                if (abortControllerRef.current?.signal.aborted) {
                    return;
                }

                if (error) {
                    throw error;
                }

                // Procesar datos de forma más eficiente
                const processedData = processWorkoutData(workoutData || []);

                if (!abortControllerRef.current?.signal.aborted) {
                    setWeightData(processedData.weightData);
                    setRepsData(processedData.repsData);
                    setTimeData(processedData.timeData);
                }

            } catch (error) {
                if (!abortControllerRef.current?.signal.aborted) {
                    console.error('Error al obtener datos de entrenamiento:', error);
                }
            } finally {
                if (!abortControllerRef.current?.signal.aborted) {
                    setLoadingCharts(false);
                }
            }
        };

        // Delay para cargar después del perfil
        const timer = setTimeout(fetchWorkoutData, 300);

        return () => {
            clearTimeout(timer);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [userId, isOpen]);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return { weightData, repsData, timeData, loadingCharts };
};

// Función auxiliar para procesar datos
const processWorkoutData = (sessions) => {
    // Inicializar estructura de datos para últimos 30 días
    const dataByDate = {};
    const timeByDay = {};
    const repsByDate = {};

    // Inicializar últimos 30 días
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];

        dataByDate[dateKey] = { fecha: dateKey, pesoTotal: 0, sesiones: 0 };
        timeByDay[dateKey] = 0;
        repsByDate[dateKey] = { fecha: dateKey, totalReps: 0 };
    }

    // Procesar sesiones
    sessions.forEach(session => {
        const dateKey = new Date(session.created_at).toISOString().split('T')[0];

        // Tiempo por día
        if (timeByDay.hasOwnProperty(dateKey)) {
            timeByDay[dateKey] += session.duracion_segundos || 0;
            dataByDate[dateKey].sesiones += 1;
        }

        // Procesar series
        session.sesiones_series?.forEach((serie) => {
            const weight = parseFloat(serie.carga_realizada);
            const reps = parseFloat(serie.reps_realizadas);

            if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0) {
                if (dataByDate[dateKey]) {
                    dataByDate[dateKey].pesoTotal += weight * reps;
                }
                if (repsByDate[dateKey]) {
                    repsByDate[dateKey].totalReps += reps;
                }
            }
        });
    });

    // Convertir a arrays finales
    const weightDataArray = Object.values(dataByDate)
        .filter((day) => day.pesoTotal > 0)
        .map((day) => ({
            fecha: day.fecha,
            peso: Math.round(day.pesoTotal * 10) / 10,
            sesiones: day.sesiones
        }));

    const timeDataArray = Object.entries(timeByDay).map(([date, seconds]) => ({
        fecha: date,
        minutos: Math.round(seconds / 60),
        fullDate: date
    }));

    // Procesar repeticiones por semana
    const totalRepsByWeek = {};
    Object.values(repsByDate).forEach((day) => {
        if (day.totalReps === 0) return;

        const date = new Date(day.fecha);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
        const weekKey = weekStart.toISOString().split('T')[0];

        totalRepsByWeek[weekKey] = (totalRepsByWeek[weekKey] || 0) + day.totalReps;
    });

    const repsDataArray = fillLastWeeks(totalRepsByWeek).map(r => ({
        ...r,
        repeticiones: r.value
    }));

    return { weightData: weightDataArray, repsData: repsDataArray, timeData: timeDataArray };
};

const fillLastWeeks = (dataObj) => {
    const filled = [];
    for (let i = 7; i >= 0; i--) {
        const week = new Date();
        week.setDate(week.getDate() - week.getDay() + (week.getDay() === 0 ? -6 : 1) - i * 7);
        const weekKey = week.toISOString().split('T')[0];
        const totalReps = dataObj[weekKey] || 0;

        filled.push({
            fecha: week.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            value: totalReps,
            fullDate: weekKey
        });
    }
    return filled;
};
