import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export const usePerfilData = (userId, isOpen) => {
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !userId) {
            return;
        }

        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const fetchPerfil = async () => {
            setLoading(true);
            setError('');

            // Crear nuevo AbortController
            abortControllerRef.current = new AbortController();

            try {
                const { data, error: err } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                // Verificar si la operación fue cancelada
                if (abortControllerRef.current?.signal.aborted) {
                    return;
                }

                if (err) {
                    setError('No se pudo cargar el perfil.');
                } else {
                    setPerfil(data);
                }
            } catch (err) {
                if (!abortControllerRef.current?.signal.aborted) {
                    setError('Error inesperado al cargar el perfil.');
                }
            } finally {
                if (!abortControllerRef.current?.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        // Pequeño delay para que el drawer se abra suavemente
        const timer = setTimeout(fetchPerfil, 150);

        return () => {
            clearTimeout(timer);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [userId, isOpen]);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return { perfil, loading, error };
};
