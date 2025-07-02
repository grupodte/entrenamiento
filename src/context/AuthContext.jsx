// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

// Constantes para las claves de localStorage
const LOCAL_STORAGE_USER_ID_KEY = 'authUserId';
const LOCAL_STORAGE_USER_ROL_KEY = 'authUserRol';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [rol, setRol] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const tryFetchRol = async (userId, currentSessionUser) => {
            console.log('[AuthContext] 🔄 Intentando obtener rol para:', userId);
            let retries = 0; // Reiniciar reintentos para cada llamada
            const maxRetries = 5;
            const delay = 500;

            while (retries < maxRetries && isMounted) {
                const { data: perfil, error } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', userId)
                    .maybeSingle();

                if (error) {
                    console.warn(`[AuthContext] 🔁 Reintento ${retries + 1} para obtener rol falló:`, error.message);
                } else if (perfil?.rol) {
                    console.log('[AuthContext] ✅ Rol obtenido de Supabase:', perfil.rol);
                    if (isMounted) {
                        setRol(perfil.rol);
                        // Almacenar en localStorage tras obtener de Supabase
                        localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, userId);
                        localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, perfil.rol);
                    }
                    return; // Rol obtenido exitosamente
                } else {
                    console.warn(`[AuthContext] ⚠️ Rol no encontrado en Supabase para ${userId} en intento ${retries + 1}.`);
                }

                retries++;
                if (retries < maxRetries) {
                    await new Promise((r) => setTimeout(r, delay));
                }
            }

            // Esta parte se ejecutará si todos los reintentos fallan
            if (isMounted) {
                console.warn(`[AuthContext] ⚠️ No se pudo obtener el rol de Supabase para ${userId} tras ${maxRetries} reintentos.`);
                // No aplicar fallback a 'admin' aquí. Se manejará en el paso 2 del plan.
                // Si ya teníamos un rol de localStorage y el user coincide, se mantendrá.
                // Si no, rol permanecerá como estaba (posiblemente null).
                const storedUserId = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY);
                if (storedUserId !== userId) { // Si el rol en localStorage no es para este usuario
                    setRol(null); // Limpiar rol si no es del usuario actual y Supabase falló
                    localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY); // Limpiar rol incorrecto
                }
            }
        };

        const initializeAuth = async () => {
            setLoading(true);
            let currentUser = null;
            let currentRol = null;

            // 1. Intentar obtener la sesión de Supabase
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    console.error('[AuthContext] ❌ Error al obtener sesión de Supabase:', sessionError);
                    // No hacer nada más, se procederá como usuario no logueado.
                }
                currentUser = session?.user || null;
                if (currentUser) {
                    setUser(currentUser); // Establecer usuario globalmente
                    console.log('[AuthContext] 🔍 Sesión de Supabase recuperada para:', currentUser.email);
                } else {
                    console.log('[AuthContext] ℹ️ No hay sesión activa en Supabase.');
                }
            } catch (e) {
                console.error('[AuthContext] ❌ Error inesperado obteniendo sesión:', e);
            }

            // 2. Si hay un usuario de la sesión, intentar cargar rol desde localStorage
            if (currentUser) {
                const storedUserId = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY);
                const storedUserRol = localStorage.getItem(LOCAL_STORAGE_USER_ROL_KEY);

                if (storedUserId === currentUser.id && storedUserRol) {
                    console.log('[AuthContext] ✅ Rol cargado desde localStorage:', storedUserRol);
                    currentRol = storedUserRol;
                    if (isMounted) setRol(currentRol);
                } else {
                    console.log('[AuthContext] ℹ️ No hay rol en localStorage para el usuario actual o ID no coincide.');
                }

                // 3. Independientemente de localStorage, intentar obtener/validar rol desde Supabase
                await tryFetchRol(currentUser.id, currentUser);
            } else {
                // No hay usuario de Supabase, limpiar estado y localStorage
                if (isMounted) {
                    setUser(null);
                    setRol(null);
                }
                localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
                localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
            }

            if (isMounted) setLoading(false);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('[AuthContext] 🔄 onAuthStateChange evento:', _event);
            const currentSessionUser = session?.user;

            if (isMounted) setUser(currentSessionUser); // Actualizar usuario inmediatamente

            if (currentSessionUser) {
                console.log('[AuthContext] ✅ Usuario cambió o inició sesión:', currentSessionUser.email);

                // Si es un nuevo login (especialmente Google), asegurar perfil y obtener rol.
                // Para logins normales, esto reconfirmará el rol.
                if (currentSessionUser.app_metadata?.provider === 'google') {
                    // ... (lógica de perfil de Google sin cambios)
                    const { data: perfil, error: perfilError } = await supabase
                        .from('perfiles')
                        .select('*')
                        .eq('id', currentSessionUser.id)
                        .maybeSingle();

                    const nombre =
                        currentSessionUser.user_metadata?.name ||
                        currentSessionUser.user_metadata?.full_name ||
                        currentSessionUser.user_metadata?.user_name ||
                        '';
                    const avatar_url = currentSessionUser.user_metadata?.avatar_url || '';

                    if (!perfil && !perfilError) {
                        console.log('[AuthContext] 🆕 Insertando perfil Google...');
                        const { error: insertError } = await supabase.from('perfiles').insert({
                            id: currentSessionUser.id,
                            email: currentSessionUser.email,
                            nombre,
                            avatar_url,
                            estado: 'Aprobado',
                            rol: 'alumno', // Rol por defecto para nuevos usuarios de Google
                        });
                        if (insertError) {
                            console.error('[AuthContext] ❌ Error insertando perfil Google:', insertError)
                        } else {
                            // Almacenar rol en localStorage después de crear perfil
                            localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, currentSessionUser.id);
                            localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, 'alumno');
                            if (isMounted) setRol('alumno');
                        }
                    } else if (perfil) {
                        const actualizaciones = {};
                        if (perfil.estado !== 'Aprobado') actualizaciones.estado = 'Aprobado';
                        if (!perfil.nombre && nombre) actualizaciones.nombre = nombre;
                        if (!perfil.avatar_url && avatar_url) actualizaciones.avatar_url = avatar_url;

                        if (Object.keys(actualizaciones).length > 0) {
                            const { error: updateError } = await supabase
                                .from('perfiles')
                                .update(actualizaciones)
                                .eq('id', currentSessionUser.id);
                            if (updateError) console.error('[AuthContext] ❌ Error actualizando perfil Google:', updateError)
                        }
                        // Establecer y almacenar rol existente para usuario de Google
                        localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, currentSessionUser.id);
                        localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, perfil.rol);
                        if (isMounted) setRol(perfil.rol);
                    }
                }
                // Para todos los usuarios (Google o no), (re)validar el rol desde Supabase.
                // Esto es especialmente importante si el rol cambió en la BD.
                await tryFetchRol(currentSessionUser.id, currentSessionUser);

            } else {
                console.log('[AuthContext] 🔒 Usuario deslogueado o sesión expirada.');
                if (isMounted) {
                    setUser(null);
                    setRol(null);
                }
                localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
                localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
            }
            if (isMounted && loading) setLoading(false); // Asegurar que loading se ponga en false
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            console.log('[AuthContext] 🧹 Suscripción de AuthContext limpiada.');
        };
    }, []); // El array de dependencias vacío asegura que esto se ejecute solo una vez al montar

    const login = (userData, userRol) => {
        console.log('[AuthContext] 🚀 Función login llamada con rol:', userRol);
        if (isMounted) { // Aunque isMounted es para useEffect, una buena práctica aquí también
            setUser(userData);
            setRol(userRol);
        }
        // Almacenar en localStorage al hacer login explícito
        localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, userData.id);
        localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, userRol);
    };

    const logout = async () => {
        console.log('[AuthContext] 🚪 Cerrando sesión...');
        await supabase.auth.signOut();
        if (isMounted) { // Aunque isMounted es para useEffect, una buena práctica aquí también
            setUser(null);
            setRol(null);
        }
        // Limpiar localStorage al cerrar sesión
        localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
        localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
        console.log('[AuthContext] 🗑️ localStorage limpiado tras logout.');
    };

    return (
        <AuthContext.Provider value={{ user, rol, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
