// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [rol, setRol] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let retries = 0;
        const maxRetries = 5;
        const delay = 500;

        const tryFetchRol = async (userId) => {
            while (retries < maxRetries && isMounted) {
                const { data: perfil, error } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', userId)
                    .maybeSingle();

                if (error) {
                    console.warn('[AuthContext] 🔁 Reintento rol falló:', error);
                } else if (perfil?.rol) {
                    console.log('[AuthContext] ✅ Rol obtenido tras reintento:', perfil.rol);
                    setRol(perfil.rol);
                    return;
                }

                retries++;
                await new Promise((r) => setTimeout(r, delay));
            }

            if (isMounted && !rol) {
                console.warn('[AuthContext] ⚠️ Timeout sin rol tras reintentos. Aplicando fallback "admin".');
                setRol('admin'); // O podrías dejarlo en null según tu app
            }
        };

        const fetchUserAndRol = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                const currentUser = session?.user;

                if (error) {
                    console.error('[AuthContext] ❌ Error al obtener sesión:', error);
                    setUser(null);
                    setRol(null);
                    setLoading(false);
                    return;
                }

                console.log('[AuthContext] 🔍 session.user:', currentUser);
                setUser(currentUser);

                if (currentUser) {
                    tryFetchRol(currentUser.id);
                } else {
                    setRol(null);
                }
            } catch (e) {
                console.error('[AuthContext] ❌ Error inesperado:', e);
                setUser(null);
                setRol(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAndRol();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user;

            if (currentUser) {
                console.log('[AuthContext] ✅ Usuario logueado:', currentUser.email);
                setUser(currentUser);

                // Google login: aseguramos perfil
                if (currentUser.app_metadata?.provider === 'google') {
                    const { data: perfil, error: perfilError } = await supabase
                        .from('perfiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .maybeSingle();

                    const nombre =
                        currentUser.user_metadata?.name ||
                        currentUser.user_metadata?.full_name ||
                        currentUser.user_metadata?.user_name ||
                        '';
                    const avatar_url = currentUser.user_metadata?.avatar_url || '';

                    if (!perfil && !perfilError) {
                        console.log('[AuthContext] 🆕 Insertando perfil Google...');
                        await supabase.from('perfiles').insert({
                            id: currentUser.id,
                            email: currentUser.email,
                            nombre,
                            avatar_url,
                            estado: 'Aprobado',
                            rol: 'alumno',
                        });
                    } else if (perfil) {
                        const actualizaciones = {};
                        if (perfil.estado !== 'Aprobado') actualizaciones.estado = 'Aprobado';
                        if (!perfil.nombre && nombre) actualizaciones.nombre = nombre;
                        if (!perfil.avatar_url && avatar_url) actualizaciones.avatar_url = avatar_url;

                        if (Object.keys(actualizaciones).length > 0) {
                            await supabase
                                .from('perfiles')
                                .update(actualizaciones)
                                .eq('id', currentUser.id);
                        }
                    }
                }

                tryFetchRol(currentUser.id);
            } else {
                console.log('[AuthContext] 🔒 Usuario deslogueado');
                setUser(null);
                setRol(null);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = (userData, userRol) => {
        setUser(userData);
        setRol(userRol);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRol(null);
    };

    return (
        <AuthContext.Provider value={{ user, rol, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
