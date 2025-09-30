import React, { useState } from 'react';
// usa tu OptionCard actualizado (sin iconos)
import OptionCard from '../OptionCard';

/**
 * Props:
 * - value: string | null  -> valor actual (ej: 'seguimiento_diario' | 'seguimiento_semanal')
 * - onChange: (val: string) => void  -> callback para actualizar estado en el padre
 * - supabase?: SupabaseClient  -> cliente supabase para persistir (opcional)
 * - profileId?: string | number  -> id del perfil en 'perfiles' (opcional, requerido si se pasa supabase)
 * - eqField?: 'id' | 'user_id'   -> columna para el where (default 'id')
 */
const FrecuenciaDietaStep = ({ value, onChange, supabase, profileId, eqField = 'id' }) => {
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const opciones = [
        {
            id: 'seguimiento_diario',
            title: 'Seguimiento diario',
            description: 'Registrar comidas cada día para mayor precisión',
        },
        {
            id: 'seguimiento_semanal',
            title: 'Seguimiento semanal',
            description: 'Revisión 1 vez por semana con foco en hábitos',
        },
    ];

    const persistIfNeeded = async (nuevoValor) => {
        if (!supabase || !profileId) return; // solo persiste si se provee supabase + profileId
        setSaving(true);
        setErrorMsg('');
        try {
            const query = supabase.from('perfiles').update({ frecuencia_dieta: nuevoValor });
            const { error } =
                eqField === 'user_id'
                    ? await query.eq('user_id', profileId)
                    : await query.eq('id', profileId);
            if (error) throw error;
        } catch (err) {
            setErrorMsg('No se pudo guardar. Reintentá más tarde.');
            // (opcional) podrías revertir onChange si querés comportamiento no optimista
        } finally {
            setSaving(false);
        }
    };

    const handleSelect = async (id) => {
        onChange?.(id);       // optimista
        await persistIfNeeded(id);
    };

    return (
        <div className="space-y-6">
  

            {/* Grid 2 columnas también en mobile */}
            <div className="grid  gap-3 md:gap-4">
                {opciones.map(({ id, title, description }) => (
                    <OptionCard
                        key={id}
                        title={title}
                        description={description}
                        selected={value === id}
                        onClick={() => handleSelect(id)}
                    />
                ))}
            </div>

            {/* Estado de guardado / error */}
            {(saving || errorMsg) && (
                <div className="rounded-2xl p-4 bg-[#191919] border border-white/10">
                    {saving && <p className="text-[13px] text-white/70">Guardando cambios…</p>}
                    {errorMsg && <p className="text-[13px] text-red-400">{errorMsg}</p>}
                </div>
            )}
        </div>
    );
};

export default FrecuenciaDietaStep;
