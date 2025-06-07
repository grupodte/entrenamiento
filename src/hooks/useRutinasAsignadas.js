// src/hooks/useRutinasAsignadas.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useRutinasAsignadas = (userId) => {
    const [rutinas, setRutinas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRutinas = async () => {
            if (!userId) return;

            const { data, error } = await supabase
                .from('asignaciones')
                .select('id, estado, rutina_id, rutinas (nombre, descripcion, video_url)')
                .eq('alumno_id', userId);

            if (error) {
                console.error('Error cargando rutinas:', error);
            } else {
                setRutinas(data);
            }

            setLoading(false);
        };

        fetchRutinas();
    }, [userId]);

    return { rutinas, loading };
};
