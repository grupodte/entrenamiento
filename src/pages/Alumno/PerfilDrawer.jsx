import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { FaEdit, FaUserCircle, FaPhone, FaBirthdayCake, FaTransgender, FaMapMarkerAlt, FaChartLine, FaChartBar, FaClock, FaSignOutAlt, FaDumbbell } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Drawer from '../../components/Drawer';
import PerfilDrawerSkeleton from '../../components/PerfilDrawerSkeleton';
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

        // Retrasar la carga de datos para que el drawer se abra primero
        const timer = setTimeout(() => {
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
        }, 100); // 100ms de retraso

        return () => clearTimeout(timer); // Limpiar el timer si el componente se desmonta
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

            // --- A. Procesar PESO TOTAL DIARIO (CAMBIADO) ---
            const dataByDate = {};
            const sessionMap = {};
            sesiones.forEach(s => (sessionMap[s.id] = s.created_at));

            // Inicializar últimos 30 días
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                dataByDate[dateKey] = {
                    fecha: dateKey,
                    pesoTotal: 0, // CAMBIADO: ya no necesitamos totalPeso y totalSeries separados
                    sesiones: 0
                };
            }

            // Procesar series por fecha - CALCULAR PESO TOTAL
            series.forEach(serie => {
                const sessionDate = sessionMap[serie.sesion_id];
                if (!sessionDate) return;

                const dateKey = new Date(sessionDate).toISOString().split('T')[0];
                const weight = parseFloat(serie.carga_realizada);
                const reps = parseFloat(serie.reps_realizadas);

                // CAMBIADO: Validar tanto peso como repeticiones
                if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) return;

                if (dataByDate[dateKey]) {
                    // CAMBIADO: Calcular peso total = peso × repeticiones
                    dataByDate[dateKey].pesoTotal += weight * reps;
                }
            });

            // Agrupar sesiones por fecha
            sesiones.forEach(sesion => {
                const dateKey = new Date(sesion.created_at).toISOString().split('T')[0];
                if (dataByDate[dateKey]) {
                    dataByDate[dateKey].sesiones += 1;
                }
            });

            // CAMBIADO: Convertir a array con peso total (no promedio)
            const weightDataArray = Object.values(dataByDate)
                .filter(day => day.pesoTotal > 0) // CAMBIADO: filtrar por peso total > 0
                .map(day => ({
                    fecha: day.fecha,
                    peso: Math.round(day.pesoTotal * 10) / 10, // CAMBIADO: mostrar peso total redondeado
                    sesiones: day.sesiones
                }));

            // --- B. Procesar TIEMPO POR DÍA (sin cambios) ---
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
                fecha: date,
                minutos: Math.round(seconds / 60),
                fullDate: date
            }));

            // --- C. Procesar REPS TOTALES DIARIAS (CAMBIADO) ---
            const repsByDate = {};

            // Inicializar últimos 30 días para repeticiones
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                repsByDate[dateKey] = {
                    fecha: dateKey,
                    totalReps: 0
                };
            }

            // CAMBIADO: Sumar todas las repeticiones por día
            series.forEach(serie => {
                const sessionDate = sessionMap[serie.sesion_id];
                if (!sessionDate) return;

                const reps = parseFloat(serie.reps_realizadas);
                if (isNaN(reps) || reps <= 0) return;

                const dateKey = new Date(sessionDate).toISOString().split('T')[0];
                if (repsByDate[dateKey]) {
                    repsByDate[dateKey].totalReps += reps;
                }
            });

            // CAMBIADO: Agrupar por semanas con TOTAL de repeticiones
            const totalRepsByWeek = {};
            Object.values(repsByDate).forEach(day => {
                if (day.totalReps === 0) return;

                const date = new Date(day.fecha);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
                const weekKey = weekStart.toISOString().split('T')[0];

                if (!totalRepsByWeek[weekKey]) {
                    totalRepsByWeek[weekKey] = 0;
                }
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

            // CAMBIADO: Usar totales de repeticiones en lugar de promedios
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

    const InfoRow = ({ icon, label, value }) => value ? (
        <div className="flex items-center text-gray-300">
            {icon && <span className="mr-2 text-cyan-400 text-base">{icon}</span>}
            <div>
                <p className="text-[10px] font-semibold text-gray-400">{label}</p>
                <p className="text-sm text-white truncate">{value}</p>
            </div>
        </div>
    ) : null;

    // Componente de Tooltip personalizado para peso
    const WeightTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-600">
                    <p className="text-gray-300 text-xs mb-1">
                        {new Date(label).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit'
                        })}
                    </p>
                    <p className="text-orange-400 font-semibold">
                        <FaDumbbell className="inline mr-1" />
                        {payload[0].value} kg promedio
                    </p>
                    {data.sesiones && (
                        <p className="text-gray-400 text-xs">
                            {data.sesiones} sesión{data.sesiones > 1 ? 'es' : ''}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Calcular estadísticas del peso
    const weightStats = weightData.length > 0 ? {
        promedio: Math.round((weightData.reduce((acc, d) => acc + d.peso, 0) / weightData.length) * 10) / 10,
        maximo: Math.max(...weightData.map(d => d.peso)),
        minimo: Math.min(...weightData.map(d => d.peso)),
        tendencia: weightData.length > 1 ?
            (weightData[weightData.length - 1].peso - weightData[0].peso).toFixed(1) : 0
    } : { promedio: 0, maximo: 0, minimo: 0, tendencia: 0 };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            {loading ? (
                <PerfilDrawerSkeleton />
            ) : error ? (
                <div className="bg-gray-800 text-white p-4">
                    <h1 className="text-xl font-bold mb-2">Error</h1>
                    <p className="text-sm text-gray-400">{error}</p>
                </div>
            ) : (
                <div className="rounded-t-2xl shadow-lg p-4 min-h-[150px]">
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
                                {/* PESO MEJORADO */}
                                <div className="bg-gray-700/20 rounded-lg p-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <FaChartLine className="text-orange-400 mr-1 text-xs" />
                                            <h3 className="text-xs font-semibold text-white">Peso Promedio</h3>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {weightData.length} días
                                        </div>
                                    </div>

                                    {/* Mini estadísticas */}
                                    <div className="grid grid-cols-2 gap-1 mb-2">
                                        <div className="text-center">
                                            <p className="text-[8px] text-gray-400">Promedio</p>
                                            <p className="text-[10px] font-semibold text-orange-400">{weightStats.promedio} kg</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] text-gray-400">Tendencia</p>
                                            <p className={`text-[10px] font-semibold ${weightStats.tendencia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {weightStats.tendencia > 0 ? '+' : ''}{weightStats.tendencia} kg
                                            </p>
                                        </div>
                                    </div>

                                    <div className="h-20">
                                        {weightData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={weightData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                                    <defs>
                                                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.5} />
                                                    <XAxis
                                                        dataKey="fecha"
                                                        tick={{ fontSize: 8, fill: '#9CA3AF' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        interval="preserveStartEnd"
                                                        tickFormatter={(tick) => {
                                                            const date = new Date(tick);
                                                            return `${date.getDate()}/${date.getMonth() + 1}`;
                                                        }}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 8, fill: '#9CA3AF' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        domain={['dataMin - 5', 'dataMax + 5']}
                                                    />
                                                    <Tooltip content={<WeightTooltip />} />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="peso"
                                                        stroke="#F97316"
                                                        strokeWidth={2}
                                                        fill="url(#weightGradient)"
                                                        dot={{ fill: '#F97316', r: 2, strokeWidth: 1, stroke: '#1F2937' }}
                                                        activeDot={{ r: 3, stroke: '#F97316', strokeWidth: 2, fill: '#FFF' }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                                <div className="text-center">
                                                    <FaDumbbell className="mx-auto mb-1 text-gray-500 text-sm" />
                                                    <p>Sin datos</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* REPETICIONES */}
                             
                            </div>

                                        <div className="bg-gray-700/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                                                        <FaChartBar className="text-purple-400 text-sm" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-white">Repeticiones Totales</h3>
                                                        <p className="text-xs text-gray-400">Por semana</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-purple-400">
                                                        {repsData?.reduce((sum, week) => sum + week.repeticiones, 0) || 0}
                                                    </div>
                                                    <div className="text-xs text-gray-400">Total mes</div>
                                                </div>
                                            </div>

                                            <div className="h-32 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart
                                                        data={repsData}
                                                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                                                    >
                                                        {/* Grid sutil */}
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            stroke="rgba(156, 163, 175, 0.1)"
                                                            horizontal={true}
                                                            vertical={false}
                                                        />

                                                        {/* Eje X mejorado */}
                                                        <XAxis
                                                            dataKey="fecha"
                                                            tick={{
                                                                fontSize: 9,
                                                                fill: '#9CA3AF',
                                                                fontWeight: 500
                                                            }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickMargin={8}
                                                        />

                                                        {/* Eje Y mejorado */}
                                                        <YAxis
                                                            tick={{
                                                                fontSize: 9,
                                                                fill: '#9CA3AF',
                                                                fontWeight: 500
                                                            }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickMargin={8}
                                                            domain={['dataMin - 10', 'dataMax + 10']}
                                                        />

                                                        {/* Tooltip mejorado */}
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                                                borderRadius: '12px',
                                                                fontSize: '11px',
                                                                backdropFilter: 'blur(8px)',
                                                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                                                            }}
                                                            labelStyle={{
                                                                color: '#E5E7EB',
                                                                fontWeight: '600',
                                                                marginBottom: '4px'
                                                            }}
                                                            formatter={(value, name) => [
                                                                <span className="text-purple-300 font-semibold">
                                                                    {value.toLocaleString()} reps
                                                                </span>,
                                                                'Total Semanal'
                                                            ]}
                                                            labelFormatter={(label) => `Semana del ${label}`}
                                                        />

                                                        {/* Área de gradiente */}
                                                        <defs>
                                                            <linearGradient id="repsGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
                                                                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.05)" />
                                                            </linearGradient>
                                                        </defs>

                                                        {/* Área bajo la curva */}
                                                        <Area
                                                            type="monotone"
                                                            dataKey="repeticiones"
                                                            stroke="none"
                                                            fill="url(#repsGradient)"
                                                        />

                                                        {/* Línea principal */}
                                                        <Line
                                                            type="monotone"
                                                            dataKey="repeticiones"
                                                            stroke="#A855F7"
                                                            strokeWidth={3}
                                                            dot={{
                                                                fill: '#A855F7',
                                                                stroke: 'rgba(17, 24, 39, 0.8)',
                                                                strokeWidth: 2,
                                                                r: 4
                                                            }}
                                                            activeDot={{
                                                                r: 6,
                                                                stroke: '#A855F7',
                                                                strokeWidth: 3,
                                                                fill: '#FFFFFF'
                                                            }}
                                                            filter="drop-shadow(0px 2px 4px rgba(168, 85, 247, 0.3))"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>

                                                {/* Indicador de tendencia */}
                                                {repsData && repsData.length >= 2 && (
                                                    <div className="absolute top-2 right-2">
                                                        {(() => {
                                                            const lastTwo = repsData.slice(-2);
                                                            const trend = lastTwo[1].repeticiones - lastTwo[0].repeticiones;
                                                            const isPositive = trend > 0;
                                                            const isNeutral = trend === 0;

                                                            if (isNeutral) return null;

                                                            return (
                                                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive
                                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                                    }`}>
                                                                    {isPositive ? '↗' : '↘'}
                                                                    <span>{Math.abs(trend)}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Estadísticas adicionales */}
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-400">Promedio</div>
                                                    <div className="text-sm font-semibold text-white">
                                                        {repsData?.length > 0
                                                            ? Math.round(repsData.reduce((sum, week) => sum + week.repeticiones, 0) / repsData.length)
                                                            : 0
                                                        } reps/sem
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-400">Mejor semana</div>
                                                    <div className="text-sm font-semibold text-purple-400">
                                                        {repsData?.length > 0
                                                            ? Math.max(...repsData.map(w => w.repeticiones))
                                                            : 0
                                                        } reps
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xs text-gray-400">Última semana</div>
                                                    <div className="text-sm font-semibold text-white">
                                                        {repsData?.length > 0
                                                            ? repsData[repsData.length - 1].repeticiones
                                                            : 0
                                                        } reps
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                            {/* Tiempo */}
                            <div className="bg-gray-700/20 rounded-lg p-3">
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