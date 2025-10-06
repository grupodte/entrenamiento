import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useWorkoutData = (userId, isOpen) => {
    const [repsData, setRepsData] = useState([]);
    const [weightWeeklyData, setWeightWeeklyData] = useState([]);
    const [timeData, setTimeData] = useState([]);
    const [weightDailyData, setWeightDailyData] = useState([]);
    const [trainingDays, setTrainingDays] = useState([]);
    const [monthlySessionsCount, setMonthlySessionsCount] = useState(0);
    const [weeklyAssignments, setWeeklyAssignments] = useState(0);
    const [currentMonthTrainingDays, setCurrentMonthTrainingDays] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);

    useEffect(() => {
        if (!userId || !isOpen) return;

        const fetchWorkoutData = async () => {
            setLoadingCharts(true);
            try {
                // Obtener fecha actual para el conteo mensual
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1; // JS months are 0-indexed

                // Consultamos todos los datos en paralelo
                const [weeklyRes, dailyRes, trainingDaysRes, monthlySessionsRes, trainingDaysPerWeekRes, currentMonthTrainingDaysRes] = await Promise.all([
                    supabase.rpc('get_weekly_workout_data', { alumno_uuid: userId }),
                    supabase.rpc('get_daily_weight_data', { alumno_uuid: userId }),
                    supabase.rpc('get_training_days', { alumno_uuid: userId }),
                    supabase.rpc('get_monthly_workout_sessions', { 
                        alumno_uuid: userId, 
                        year: currentYear, 
                        month: currentMonth 
                    }),
                    supabase.rpc('get_user_training_days_per_week', { alumno_uuid: userId }),
                    supabase.rpc('get_training_days_current_month', { alumno_uuid: userId })
                ]);

                if (weeklyRes.error) throw weeklyRes.error;
                if (dailyRes.error) throw dailyRes.error;
                if (trainingDaysRes.error) throw trainingDaysRes.error;
                if (monthlySessionsRes.error) {
                    console.error('Error fetching monthly sessions:', monthlySessionsRes.error);
                    // No lanzar error, solo loggear
                }
                if (trainingDaysPerWeekRes.error) {
                    console.error('Error fetching training days per week:', trainingDaysPerWeekRes.error);
                    // No lanzar error, solo loggear
                }
                if (currentMonthTrainingDaysRes.error) {
                    console.error('Error fetching current month training days:', currentMonthTrainingDaysRes.error);
                    // No lanzar error, solo loggear
                }

                const weeklyData = weeklyRes.data || [];
                const dailyData = dailyRes.data || [];
                const trainingDaysData = trainingDaysRes.data || [];
                const monthlySessionsData = monthlySessionsRes.data || 0;
                const weeklyAssignmentsData = trainingDaysPerWeekRes.data || 0;
                const currentMonthTrainingDaysData = currentMonthTrainingDaysRes.data || [];

                // Guardar el conteo de sesiones mensuales, asignaciones semanales y días del mes con entrenamientos
                setMonthlySessionsCount(monthlySessionsData);
                setWeeklyAssignments(weeklyAssignmentsData);
                setCurrentMonthTrainingDays(currentMonthTrainingDaysData.map(item => item.dia));
                console.log('📊 useWorkoutData: Sesiones del mes:', monthlySessionsData);
                console.log('📊 useWorkoutData: Asignaciones por semana:', weeklyAssignmentsData);
                console.log('📊 useWorkoutData: Días del mes con entrenamientos:', currentMonthTrainingDaysData);

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

                // === Días de entrenamiento (YYYY-MM-DD) ===
                setTrainingDays(trainingDaysData.map(d => d.fecha));
            } catch (error) {
                console.error("Error al cargar datos de entrenamiento:", error);
            } finally {
                setLoadingCharts(false);
            }
        };

        fetchWorkoutData();
    }, [userId, isOpen]);

    return {
        repsData,
        weightWeeklyData,
        timeData,
        weightDailyData,
        trainingDays,
        monthlySessionsCount,
        weeklyAssignments,
        currentMonthTrainingDays,
        loadingCharts
    };
};
