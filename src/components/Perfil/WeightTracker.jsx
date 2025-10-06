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
        <div className="bg-[#000000] border border-white/10 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/90">Control de peso</h3>
                <div className="text-xs text-white/60">{loading ? 'Cargando…' : diffText}</div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                    <div className="text-[11px] text-white/60">
                        Inicial {progreso?.total_registros === 0 ? '(perfil)' : '(perfil)'}
                    </div>
                    <div className="text-base font-semibold">{progreso?.peso_inicial ?? '–'} kg</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                    <div className="text-[11px] text-white/60">
                        Actual {progreso?.total_registros > 0 ? `(${progreso.total_registros} reg.)` : ''}
                    </div>
                    <div className="text-base font-semibold">{progreso?.peso_actual ?? '–'} kg</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                    <div className="text-[11px] text-white/60">Cambio</div>
                    <div className={`text-base font-semibold ${
                        progreso?.diferencia < 0 ? 'text-green-400' : 
                        progreso?.diferencia > 0 ? 'text-red-400' : 
                        'text-white'
                    }`}>
                        {diffText}
                    </div>
                </div>
            </div>

            {/* Form de carga */}
            <div className="flex    items-center gap-2 mb-3">
                <input
                    type="date"
                    value={fechaInput}
                    onChange={(e) => setFechaInput(e.target.value)}
                    className="bg-white/10 text-white text-xs rounded px-2 py-2 border border-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
                    style={{ width: 120 }}
                />
                <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="1"
                    placeholder="Peso (kg)"
                    value={pesoInput}
                    onChange={(e) => setPesoInput(e.target.value)}
                    className="flex-1 bg-white/10 w-[50px] text-white text-sm rounded px-2 py-2 border border-white/10 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
                />
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-3 py-2 rounded-lg bg-[#FF0000] text-[#000000] text-sm font-semibold hover:bg-cyan-300 disabled:opacity-60"
                >
                    {saving ? 'Guardando…' : 'Guardar'}
                </button>
            </div>

            {/* Mensaje informativo o historial */}
            {historial?.length > 0 ? (
                <div className="mt-2">
                    <div className="text-[11px] text-white/60 mb-1">Historial reciente</div>
                    <div className="grid grid-cols-4 gap-2">
                        {historial.map((r) => (
                            <div key={`${r.fecha_registro}`} className="bg-white/5 border border-white/10 rounded p-2 text-center">
                                <div className="text-[10px] text-white/50">
                                    {new Date(r.fecha_registro).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                </div>
                                <div className="text-sm font-semibold">{Number(r.peso_kg).toFixed(1)} kg</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="">
                 
                </div>
            )}
        </div>
    );
};

export default WeightTracker;

