import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

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
                .order('fecha_registro', { ascending: false })
                .limit(8);
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
        if (!progreso || progreso.total_registros === 0) return 'Sin registros';
        const diff = progreso.diferencia;
        if (diff === null) return 'Sin cambios';
        if (diff > 0) return `+${diff.toFixed(1)} kg`;
        if (diff < 0) return `${diff.toFixed(1)} kg`;
        return 'Sin cambios';
    }, [progreso]);

    return (
        <div className="bg-[#000000] border  rounded-[10px] flex flex-col justify-center px-4 h-[211px] text-white">
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
                    className="px-3 py-2 rounded-lg bg-[#FF0000] text-[#000000] text-sm font-semibold hover:bg-cyan-300 disabled:opacity-60"
                >
                    {saving ? 'Guardando…' : 'Guardar'}
                </button>
            </div>

        
        </div>
    );
};

export default WeightTracker;

