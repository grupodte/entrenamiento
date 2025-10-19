import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import saveIcon from '../../assets/save.svg';

const WeightTracker = ({ userId }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pesoInput, setPesoInput] = useState('');
    const [fechaInput, setFechaInput] = useState(() => new Date().toISOString().slice(0, 10));
    const [progreso, setProgreso] = useState(null);
    const [historial, setHistorial] = useState([]);

    const fetchData = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data: progressData, error: progressError } = await supabase.rpc('get_weight_progress', { alumno_uuid: userId });
            if (progressError) throw progressError;
            setProgreso(progressData);

            const { data: registros, error: registrosError } = await supabase
                .from('registros_peso')
                .select('fecha_registro, peso_kg')
                .eq('alumno_id', userId)
                .order('fecha_registro', { ascending: true })
                .limit(15);
            if (registrosError) throw registrosError;
            setHistorial(registros || []);
        } catch (e) {
            console.error('Error cargando progreso de peso:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const onSave = async () => {
        if (!userId) return;
        const peso = parseFloat(pesoInput);
        if (!Number.isFinite(peso) || peso <= 0) {
            alert('Ingresa un peso válido en kg');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase
                .from('registros_peso')
                .upsert({
                    alumno_id: userId,
                    fecha_registro: fechaInput,
                    peso_kg: peso
                }, { onConflict: 'alumno_id,fecha_registro' });
            if (error) throw error;
            setPesoInput('');
            await fetchData();
        } catch (e) {
            console.error('Error guardando peso:', e);
            alert('No se pudo guardar el peso');
        } finally {
            setSaving(false);
        }
    };

    const diffText = useMemo(() => {
        if (!progreso || progreso.total_registros === 0) return '';
        const diff = progreso.diferencia;
        if (diff === null) return 'Sin cambios';
        if (diff > 0) return `+${diff.toFixed(1)} kg`;
        if (diff < 0) return `${diff.toFixed(1)} kg`;
        return 'Sin cambios';
    }, [progreso]);

    // Función para formatear fecha
    const formatDate = (dateString, includeYear = false) => {
        if (!dateString) return 'Sin fecha';
        
        // Para fechas en formato YYYY-MM-DD, crear la fecha en zona horaria local
        // para evitar problemas de zona horaria UTC
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            console.warn('Fecha inválida recibida:', dateString);
            return 'Fecha inválida';
        }
        
        const dayFormatted = date.getDate().toString().padStart(2, '0');
        const monthFormatted = (date.getMonth() + 1).toString().padStart(2, '0');
        const yearFormatted = date.getFullYear();
        
        return includeYear ? `${dayFormatted}/${monthFormatted}/${yearFormatted}` : `${dayFormatted}/${monthFormatted}`;
    };

    // Procesar datos para el gráfico
    const chartData = useMemo(() => {
        if (!historial || historial.length === 0) return [];
        
        return historial.map(registro => ({
            fecha: registro.fecha_registro,
            peso: registro.peso_kg,
            fechaFormateada: formatDate(registro.fecha_registro)
        }));
    }, [historial]);

    // Componente de tooltip personalizado
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-[#191919] p-2 rounded-lg border border-[#333]">
                    <p className="text-white text-sm">
                        {formatDate(data.fecha, true)}
                    </p>
                    <p className="text-[#FF0000] text-sm font-bold">
                        {`${data.peso} kg`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#000000] border rounded-[10px] flex flex-col px-4 py-4 text-white" style={{minHeight: '400px'}}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] text-[#FFFFFF]">Control de peso</h3>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-1 mb-3">
                <div className="bg-[#191919] max-w-[110px] h-[81px] flex flex-col justify-center rounded-[17px] text-center">
                    <div className="text-[15px] text-[#FFFFFF] ">
                        Inicial 
                    </div>
                    <div className="text-[25px] font-bold text-[#FFFFFF]">{progreso?.peso_inicial ?? '–'} kg</div>
                </div>
                <div className="bg-[#191919] max-w-[110px] h-[81px] flex flex-col justify-center rounded-[17px] text-center">
                    <div className="text-[15px] text-[#FFFFFF] ">
                        Actual 
                    </div>
                    <div className="text-[25px] font-bold text-[#FFFFFF] ">{progreso?.peso_actual ?? '–'} kg</div>
                </div>
                <div className="bg-[#191919] max-w-[110px] h-[81px] flex flex-col justify-center rounded-[17px] text-center">
                    <div className="text-[15px] text-[#FFFFFF]">Cambio</div>
                    <div className={`text-[25px] font-bold ${
                        progreso?.diferencia < 0 ? 'text-[#2100D9]' : 
                        progreso?.diferencia > 0 ? 'text-[#FF0000]' : 
                        'text-[#FFFFFF]'
                    }`}>
                        {diffText}
                    </div>
                </div>
            </div>

            {/* Form de carga */}
            <div className="flex items-center gap-1  w-full">
                <input
                    type="date"
                    value={fechaInput}
                    onChange={(e) => setFechaInput(e.target.value)}
                    className="bg-[#191919] text-[#FFFFFF] text-[16px] rounded-[17px] border-none max-w-[160px] hide-calendar-icon"
                />
                <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="1"
                    placeholder="Peso (kg)"
                    value={pesoInput}
                    onChange={(e) => setPesoInput(e.target.value)}
                    className="bg-[#191919] text-[#515151] text-[16px] rounded-[17px] border-none w-[100px]"
                />
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="h-[40px] w-[54px] rounded-[17px] bg-[#FF0000] text-[#000000]  flex items-center justify-center"
                >
                    {saving ? (
                        'Guardando…'
                    ) : (
                        <img 
                            src={saveIcon} 
                            alt="save" 
                            className="w-[18px] h-[18px]" 
                        />
                    )}
                </button>
            </div>

            {/* Gráfico de progreso */}
            {chartData.length > 0 && (
                <div className="mt-4">
                    <div className="h-48 focus:outline-none" style={{ outline: 'none' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                                data={chartData} 
                                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                                style={{ outline: 'none' }}
                            >
                                <XAxis 
                                    dataKey="fechaFormateada"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#FFFFFF', fontSize: 12 }}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#FFFFFF', fontSize: 12 }}
                                    domain={['dataMin - 2', 'dataMax + 2']}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="peso" 
                                    stroke="#FF0000" 
                                    strokeWidth={2}
                                    dot={{ fill: '#FF0000', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: '#FF0000' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeightTracker;

