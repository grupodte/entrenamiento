import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Importamos el hook de autenticación base
import { supabase } from '../lib/supabaseClient'; // Importamos el cliente de Supabase

/**
 * Hook personalizado para obtener el usuario autenticado y su perfil extendido.
 * Devuelve el objeto `user` de Supabase Auth, el objeto `perfil` de la tabla `perfiles`,
 * un estado de carga combinado y un posible error durante la carga del perfil.
 */
export const useAuthUser = () => {
    const { user, loading: authLoading, rol } = useAuth(); // Obtenemos user y loading del AuthContext
    const [perfil, setPerfil] = useState(null);
    const [loadingPerfil, setLoadingPerfil] = useState(true);
    const [errorPerfil, setErrorPerfil] = useState(null);

    useEffect(() => {
        // Solo intentar cargar el perfil si la autenticación no está cargando y hay un usuario
        if (!authLoading && user) {
            setLoadingPerfil(true);
            setErrorPerfil(null);

            const fetchPerfil = async () => {
                try {
                    const { data, error } = await supabase
                        .from('perfiles')
                        .select('*') // Seleccionamos todos los campos del perfil
                        .eq('id', user.id) // Usamos user.id que es la FK a perfiles.id según la estructura previa
                        .single();

                    if (error) {
                        // Si el error es PGRST116, significa "Objeto no encontrado", lo cual es normal si el perfil aún no existe.
                        // Podríamos querer crear un perfil por defecto aquí o manejarlo de otra forma.
                        if (error.code === 'PGRST116') {
                            console.warn(`[useAuthUser] Perfil no encontrado para el usuario ${user.id}. Esto puede ser normal si es un nuevo usuario.`);
                            setPerfil(null); // O un objeto perfil por defecto si se prefiere
                        } else {
                            console.error('[useAuthUser] Error al cargar el perfil:', error);
                            setErrorPerfil(error);
                            setPerfil(null);
                        }
                    } else {
                        setPerfil(data);
                    }
                } catch (e) {
                    console.error('[useAuthUser] Excepción al cargar el perfil:', e);
                    setErrorPerfil(e);
                    setPerfil(null);
                } finally {
                    setLoadingPerfil(false);
                }
            };

            fetchPerfil();
        } else if (!authLoading && !user) {
            // Si no hay usuario y la autenticación ha terminado de cargar, reseteamos el perfil.
            setPerfil(null);
            setLoadingPerfil(false);
            setErrorPerfil(null);
        }
    }, [user, authLoading]); // Dependencias del useEffect

    return {
        user, // El objeto user de Supabase Auth
        perfil, // El objeto perfil de la tabla 'perfiles'
        rol, // El rol que ya provee useAuth (si se sigue necesitando directamente)
        isLoading: authLoading || loadingPerfil, // Estado de carga combinado
        error: errorPerfil, // Posible error al cargar el perfil
    };
};
