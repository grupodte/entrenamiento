import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useWorkoutData = (userId, isOpen) => {
    const [repsData, setRepsData] = useState([]);
    const [weightWeeklyData, setWeightWeeklyData] = useState([]);
    const [timeData, setTimeData] = useState([]);
    const [weightDailyData, setWeightDailyData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);

    useEffect(() => {
        if (!userId || !isOpen) return;

        const fetchWorkoutData = async () => {
            setLoadingCharts(true);
            try {
                // Consultamos ambos RPC en paralelo
                const [weeklyRes, dailyRes] = await Promise.all([
                    supabase.rpc('get_weekly_workout_data', { alumno: String(userId) }),
                    supabase.rpc('get_daily_weight_data', { alumno: String(userId) })
                ]);

                if (weeklyRes.error) throw weeklyRes.error;
                if (dailyRes.error) throw dailyRes.error;

                const weeklyData = weeklyRes.data || [];
                const dailyData = dailyRes.data || [];

                const formatDate = (date) =>
                    new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

                // === Datos semanales ===
                setRepsData(
                    weeklyData.map(item => ({
                        fecha: formatDate(item.semana_inicio),
                        repeticiones: parseInt(item.total_reps) || 0,
                        fullDate: item.semana_inicio
                    }))
                );

                setWeightWeeklyData(
                    weeklyData.map(item => ({
                        fecha: formatDate(item.semana_inicio),
                        carga: parseFloat(item.total_carga) || 0,
                        fullDate: item.semana_inicio
                    }))
                );

                setTimeData(
                    weeklyData.map(item => ({
                        fecha: formatDate(item.semana_inicio),
                        minutos: parseInt(item.total_minutos) || 0,
                        fullDate: item.semana_inicio
                    }))
                );

                // === Datos diarios ===
                setWeightDailyData(
                    dailyData.map(item => ({
                        fecha: formatDate(item.fecha),
                        carga: parseFloat(item.total_carga) || 0,
                        fullDate: item.fecha
                    }))
                );
            } catch (error) {
                console.error("Error al cargar datos de entrenamiento:", error);
            } finally {
                setLoadingCharts(false);
            }
        };

        fetchWorkoutData();
    }, [userId, isOpen]);

    return { repsData, weightWeeklyData, timeData, weightDailyData, loadingCharts };
};
