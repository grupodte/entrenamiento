import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import ProfileInfo from '../../components/Perfil/ProfileInfo';
import WorkoutStats from '../../components/Perfil/WorkoutStats';
import Drawer from '../../components/Drawer';
import { useNavigate } from 'react-router-dom';

const PerfilDrawer = ({ isOpen, onClose, onEdit }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [weightData, setWeightData] = useState([]);
    const [repsData, setRepsData] = useState([]);
    const [timeData, setTimeData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchPerfil = async () => {
            setLoading(true);
            try {
                const { data, error: err } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (err) setError('No se pudo cargar el perfil.');
                else setPerfil(data);
                await fetchWorkoutData();
            } catch (e) {
                setError('Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchPerfil();
    }, [isOpen, user]);

    const fetchWorkoutData = async () => {
        if (!user) return;
        setLoadingCharts(true);
        try {
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            const { data: sesiones, error: sessionError } = await supabase
                .from('sesiones_entrenamiento')
                .select('id, created_at, duracion_segundos')
                .eq('alumno_id', user.id)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: true });
            if (sessionError) throw sessionError;

            const sessionIds = sesiones?.map(s => s.id) || [];

            const { data: series, error: seriesError } = await supabase
                .from('sesiones_series')
                .select('carga_realizada, reps_realizadas, sesion_id')
                .in('sesion_id', sessionIds);
            if (seriesError) throw seriesError;

            const dataByDate = {};
            const sessionMap = {};
            sesiones.forEach(s => (sessionMap[s.id] = s.created_at));

            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                dataByDate[dateKey] = { fecha: dateKey, pesoTotal: 0, sesiones: 0 };
            }

            series.forEach(serie => {
                const sessionDate = sessionMap[serie.sesion_id];
                if (!sessionDate) return;
                const dateKey = new Date(sessionDate).toISOString().split('T')[0];
                const weight = parseFloat(serie.carga_realizada);
                const reps = parseFloat(serie.reps_realizadas);
                if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) return;
                if (dataByDate[dateKey]) dataByDate[dateKey].pesoTotal += weight * reps;
            });

            sesiones.forEach(sesion => {
                const dateKey = new Date(sesion.created_at).toISOString().split('T')[0];
                if (dataByDate[dateKey]) dataByDate[dateKey].sesiones += 1;
            });

            const weightDataArray = Object.values(dataByDate)
                .filter(day => day.pesoTotal > 0)
                .map(day => ({
                    fecha: day.fecha,
                    peso: Math.round(day.pesoTotal * 10) / 10,
                    sesiones: day.sesiones
                }));

            const timeByDay = {};
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                timeByDay[dateKey] = 0;
            }
            sesiones.forEach(sesion => {
                const dateKey = new Date(sesion.created_at).toISOString().split('T')[0];
                if (timeByDay.hasOwnProperty(dateKey)) timeByDay[dateKey] += sesion.duracion_segundos || 0;
            });
            const timeDataArray = Object.entries(timeByDay).map(([date, seconds]) => ({
                fecha: date,
                minutos: Math.round(seconds / 60),
                fullDate: date
            }));

            const repsByDate = {};
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                repsByDate[dateKey] = { fecha: dateKey, totalReps: 0 };
            }

            series.forEach(serie => {
                const sessionDate = sessionMap[serie.sesion_id];
                if (!sessionDate) return;
                const reps = parseFloat(serie.reps_realizadas);
                if (isNaN(reps) || reps <= 0) return;
                const dateKey = new Date(sessionDate).toISOString().split('T')[0];
                if (repsByDate[dateKey]) repsByDate[dateKey].totalReps += reps;
            });

            const totalRepsByWeek = {};
            Object.values(repsByDate).forEach(day => {
                if (day.totalReps === 0) return;
                const date = new Date(day.fecha);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
                const weekKey = weekStart.toISOString().split('T')[0];
                if (!totalRepsByWeek[weekKey]) totalRepsByWeek[weekKey] = 0;
                totalRepsByWeek[weekKey] += day.totalReps;
            });

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

            const repsDataArray = fillLastWeeks(totalRepsByWeek).map(r => ({ ...r, repeticiones: r.value }));

            setWeightData(weightDataArray);
            setRepsData(repsDataArray);
            setTimeData(timeDataArray);
        } catch (error) {
            console.error('Error al obtener datos de entrenamiento:', error);
        } finally {
            setLoadingCharts(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    // Si está cargando, no mostramos nada (drawer no se abre)
    if (loading) return null;

    return (
        <Drawer isOpen={isOpen && !loading} onClose={onClose}>
            {error ? (
                <div className="bg-gray-800 text-white p-4">
                    <h1 className="text-xl font-bold mb-2">Error</h1>
                    <p className="text-sm text-gray-400">{error}</p>
                </div>
            ) : (
                <div className="rounded-t-2xl shadow-lg p-4 min-h-[150px]">
                    <ProfileInfo user={user} perfil={perfil} onEdit={onEdit} onLogout={handleLogout} />
                    <WorkoutStats weightData={weightData} repsData={repsData} timeData={timeData} loadingCharts={loadingCharts} />
                </div>
            )}
        </Drawer>
    );
};

export default PerfilDrawer;
