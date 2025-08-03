import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Cache global para rutinas
const rutinaCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

export const useRutinaCache = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const activeRequestsRef = useRef(new Map());

    const getCacheKey = (rutinaId, tipo) => `${tipo}-${rutinaId}`;

    const isValidCache = (cacheEntry) => {
        if (!cacheEntry) return false;
        return Date.now() - cacheEntry.timestamp < CACHE_EXPIRY;
    };

    const fetchRutinaData = useCallback(async (rutinaId, tipo) => {
        const cacheKey = getCacheKey(rutinaId, tipo);
        
        // Verificar caché válido
        const cachedData = rutinaCache.get(cacheKey);
        if (isValidCache(cachedData)) {
            return cachedData.data;
        }

        // Verificar si ya hay una petición en curso para esta rutina
        if (activeRequestsRef.current.has(cacheKey)) {
            return activeRequestsRef.current.get(cacheKey);
        }

        setLoading(true);
        setError(null);

        try {
            const fromTable = tipo === 'base' ? 'rutinas_base' : 'rutinas_personalizadas';
            
            // Hacer una sola consulta optimizada
            const { data: rutinaData, error: rutinaError } = await supabase
                .from(fromTable)
                .select(`
                    id,
                    nombre,
                    descripcion,
                    bloques (
                        id,
                        nombre,
                        orden,
                        semana_inicio,
                        semana_fin
                    )
                `)
                .eq('id', rutinaId)
                .single();

            if (rutinaError) throw rutinaError;

            // Procesar bloques con nombres por defecto
            const bloquesConEtiquetas = (rutinaData.bloques || [])
                .sort((a, b) => a.orden - b.orden)
                .map((b, i) => ({
                    ...b,
                    nombre: b.nombre && b.nombre.trim() !== ""
                        ? b.nombre
                        : `Mes ${i + 1} (Semanas ${b.semana_inicio}-${b.semana_fin})`
                }));

            const result = {
                rutina: {
                    id: rutinaData.id,
                    nombre: rutinaData.nombre || 'Rutina',
                    descripcion: rutinaData.descripcion || ''
                },
                bloques: bloquesConEtiquetas
            };

            // Guardar en caché
            rutinaCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            activeRequestsRef.current.delete(cacheKey);
            return result;

        } catch (err) {
            console.error('Error fetching rutina data:', err);
            setError('Error al cargar los datos de la rutina');
            activeRequestsRef.current.delete(cacheKey);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const invalidateCache = useCallback((rutinaId, tipo) => {
        const cacheKey = getCacheKey(rutinaId, tipo);
        rutinaCache.delete(cacheKey);
        activeRequestsRef.current.delete(cacheKey);
    }, []);

    const clearAllCache = useCallback(() => {
        rutinaCache.clear();
        activeRequestsRef.current.clear();
    }, []);

    return {
        fetchRutinaData,
        invalidateCache,
        clearAllCache,
        loading,
        error
    };
};
