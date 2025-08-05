import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { FaEdit, FaUserCircle, FaPhone, FaBirthdayCake, FaTransgender, FaMapMarkerAlt, FaChartLine, FaChartBar, FaClock, FaSignOutAlt } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Drawer from '../../components/Drawer';
import DrawerLoader from '../../components/DrawerLoader';
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
            const { data, error: err } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
            if (err) setError('No se pudo cargar el perfil.');
            else {
                setPerfil(data);
            }
            setLoading(false);
        };
        fetchPerfil();
        fetchWorkoutData();
    }, [isOpen, user]);

    const fetchWorkoutData = async () => {
        if (!user) return;
        setLoadingCharts(true);
        try {
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);

            // 1. Sesiones últimos 30 días
            const { data: sesiones, error: sessionError } = await supabase
                .from('sesiones_entrenamiento')
                .select('id, created_at, duracion_segundos')
                .eq('alumno_id', user.id)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (sessionError) throw sessionError;

            const sessionIds = sesiones?.map(s => s.id) || [];

            // 2. Series asociadas
            const { data: series, error: seriesError } = await supabase
                .from('sesiones_series')
                .select('carga_realizada, reps_realizadas, sesion_id')
                .in('sesion_id', sessionIds);

            if (seriesError) throw seriesError;

            // --- A. Procesar TIEMPO POR DÍA ---
            const timeByDay = {};
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                timeByDay[dateKey] = 0;
            }
            sesiones.forEach(sesion => {
                const dateKey = new Date(sesion.created_at).toISOString().split('T')[0];
                if (timeByDay.hasOwnProperty(dateKey)) {
                    timeByDay[dateKey] += sesion.duracion_segundos || 0;
                }
            });
            const timeDataArray = Object.entries(timeByDay).map(([date, seconds]) => ({
                fecha: date, // Use fullDate for dataKey
                minutos: Math.round(seconds / 60),
                fullDate: date
            }));

            // --- B. Procesar PROMEDIOS PESO/REPS ---
            const sessionMap = {};
            sesiones.forEach(s => (sessionMap[s.id] = s.created_at));

            const sessionData = {};
            series.forEach(serie => {
                const sessionDate = sessionMap[serie.sesion_id];
                if (!sessionDate) return;

                // Convertir a números y validar que no sean "EMPTY" o inválidos
                const weight = parseFloat(serie.carga_realizada);
                const reps = parseFloat(serie.reps_realizadas);

                // Solo procesar si ambos valores son números válidos
                if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) return;

                if (!sessionData[serie.sesion_id]) {
                    sessionData[serie.sesion_id] = { date: sessionDate, totalVolume: 0, reps: [], validSeries: 0 };
                }

                sessionData[serie.sesion_id].totalVolume += weight * reps; // sumamos volumen de la serie
                sessionData[serie.sesion_id].reps.push(reps);
                sessionData[serie.sesion_id].validSeries++;
            });

            // --- Agrupación semanal ---
            const volumeByWeek = {};
            const avgRepsPerSessionByWeek = {};

            Object.values(sessionData).forEach(session => {
                // Solo procesar sesiones que tengan al menos una serie válida
                if (session.validSeries === 0) return;

                const date = new Date(session.date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // Monday of the week
                const weekKey = weekStart.toISOString().split('T')[0];

                if (!volumeByWeek[weekKey]) {
                    volumeByWeek[weekKey] = 0;
                }
                volumeByWeek[weekKey] += session.totalVolume;

                if (!avgRepsPerSessionByWeek[weekKey]) {
                    avgRepsPerSessionByWeek[weekKey] = [];
                }
                // Calculate average reps for the session
                if (session.reps.length > 0) {
                    const avgR = session.reps.reduce((a, b) => a + b, 0) / session.reps.length;
                    avgRepsPerSessionByWeek[weekKey].push(avgR);
                }
            });

            // --- Rellenar últimas 8 semanas ---
            const fillLastWeeks = (dataObj, isVolume = false) => {
                const filled = [];
                for (let i = 7; i >= 0; i--) {
                    const week = new Date();
                    week.setDate(week.getDate() - week.getDay() + (week.getDay() === 0 ? -6 : 1) - i * 7); // Monday of the week
                    const weekKey = week.toISOString().split('T')[0];
                    const values = dataObj[weekKey] || (isVolume ? 0 : []);

                    let valueToPush;
                    if (isVolume) {
                        valueToPush = values;
                    } else {
                        valueToPush = values.length > 0
                            ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
                            : 0;
                    }

                    filled.push({
                        fecha: week.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                        value: valueToPush,
                        fullDate: weekKey
                    });
                }
                return filled;
            };

            const weightDataArray = fillLastWeeks(volumeByWeek, true).map(w => ({ ...w, peso: w.value }));
            const repsDataArray = fillLastWeeks(avgRepsPerSessionByWeek).map(r => ({ ...r, repeticiones: r.value }));

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

    const InfoRow = ({ icon, label, value }) => value ? (
        <div className="flex items-center text-gray-300">
            {icon && <span className="mr-2 text-cyan-400 text-base">{icon}</span>}
            <div>
                <p className="text-[10px] font-semibold text-gray-400">{label}</p>
                <p className="text-sm text-white truncate">{value}</p>
            </div>
        </div>
    ) : null;

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            {loading ? (
                <DrawerLoader />
            ) : error ? (
                <div className="bg-gray-800 text-white p-4">
                    <h1 className="text-xl font-bold mb-2">Error</h1>
                    <p className="text-sm text-gray-400">{error}</p>
                </div>
            ) : (
                // --- VISTA PERFIL + GRÁFICOS ---
                <div className="bg-gray-800 rounded-t-2xl shadow-lg p-4 min-h-[150px]">
                    <div className="flex items-center mb-3 space-x-3">
                        {perfil.avatar_url ? <img src={perfil.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-cyan-500" /> : <FaUserCircle className="text-4xl text-blue-400" />}
                        <div>
                            <h2 className="text-sm font-semibold text-white">{perfil.nombre} {perfil.apellido}</h2>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={onEdit} className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-700"><FaEdit className="text-white text-sm" /></button>
                            <button onClick={handleLogout} className="p-2 rounded-full bg-red-600 hover:bg-red-700"><FaSignOutAlt className="text-white text-sm" /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                        <InfoRow icon={<FaBirthdayCake />} label="Edad" value={perfil.edad ? `${perfil.edad} años` : null} />
                        <InfoRow icon={<FaTransgender />} label="Género" value={perfil.genero} />
                        <InfoRow icon={<FaPhone />} label="Teléfono" value={perfil.telefono} />
                        <InfoRow icon={<FaMapMarkerAlt />} label="Ubicación" value={perfil.ciudad && perfil.pais ? `${perfil.ciudad}, ${perfil.pais}` : perfil.ciudad || perfil.pais} />
                    </div>

                    {loadingCharts ? (
                        <div className="text-center py-4"><p className="text-gray-400 text-sm">Cargando estadísticas...</p></div>
                    ) : (
                        <div className="space-y-4">
                            {/* Peso y Reps */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-700 rounded-lg p-2">
                                    <div className="flex items-center mb-2"><FaChartLine className="text-orange-400 mr-1 text-xs" /><h3 className="text-xs font-semibold text-white">Peso Promedio</h3></div>
                                    <div className="h-24">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={weightData}>
                                                <CartesianGrid strokeDasharray="2 2" stroke="#374151" />
                                                <XAxis
                                                    dataKey="fecha"
                                                    tick={{ fontSize: 8, fill: '#9CA3AF' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(tick) => new Date(tick).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                                />
                                                <YAxis tick={{ fontSize: 8, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '6px', fontSize: '10px' }} formatter={(v) => [`${v} kg`, 'Volumen']} />
                                                <Line type="monotone" dataKey="peso" stroke="#F97316" strokeWidth={2} dot={{ fill: '#F97316', r: 2 }} activeDot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-2">
                                    <div className="flex items-center mb-2"><FaChartBar className="text-purple-400 mr-1 text-xs" /><h3 className="text-xs font-semibold text-white">Repeticiones</h3></div>
                                    <div className="h-24">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={repsData}>
                                                <CartesianGrid strokeDasharray="2 2" stroke="#374151" />
                                                <XAxis
                                                    dataKey="fecha"
                                                    tick={{ fontSize: 8, fill: '#9CA3AF' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(tick) => new Date(tick).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                                />
                                                <YAxis tick={{ fontSize: 8, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '6px', fontSize: '10px' }} formatter={(v) => [`${v} reps`, 'Reps Promedio']} />
                                                <Line type="monotone" dataKey="repeticiones" stroke="#A855F7" strokeWidth={2} dot={{ fill: '#A855F7', r: 2 }} activeDot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            {/* Tiempo */}
                            <div className="bg-gray-700 rounded-lg p-3">
                                <div className="flex items-center mb-2"><FaClock className="text-green-400 mr-2 text-sm" /><h3 className="text-sm font-semibold text-white">Tiempo de Entrenamiento (min)</h3></div>
                                <div className="h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={timeData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis
                                                dataKey="fecha"
                                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(tick) => new Date(tick).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            />
                                            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [v, 'Minutos']} />
                                            <Line type="monotone" dataKey="minutos" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} activeDot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Drawer>
    );
};

export default PerfilDrawer;
