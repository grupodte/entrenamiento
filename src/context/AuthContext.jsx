// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

const LOCAL_STORAGE_USER_ID_KEY = 'authUserId';
const LOCAL_STORAGE_USER_ROL_KEY = 'authUserRol';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [rol, setRol] = useState(() => {
        return localStorage.getItem(LOCAL_STORAGE_USER_ROL_KEY) || null;
    });
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
                    localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, perfil.rol);
                    return;
                }

                retries++;
                await new Promise((r) => setTimeout(r, delay));
            }

            console.warn('[AuthContext] ⚠️ No se obtuvo rol tras reintentos, manteniendo rol de localStorage.');
            // NO sobrescribimos el rol si ya había algo en localStorage
        };

        const fetchUserAndRol = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                const currentUser = session?.user;

                if (error) {
                    console.error('[AuthContext] ❌ Error al obtener sesión:', error);
                    setUser(null);
                    setRol(null);
                    localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
                    localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
                    setLoading(false);
                    return;
                }

                console.log('[AuthContext] 🔍 session.user:', currentUser);
                setUser(currentUser);

                if (currentUser) {
                    localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, currentUser.id);

                    // 👇 NEW
                    const rolEnStorage = localStorage.getItem(LOCAL_STORAGE_USER_ROL_KEY);
                    if (rolEnStorage) {
                        console.log("[AuthContext] ✅ Rol recuperado desde localStorage:", rolEnStorage);
                        setRol(rolEnStorage);
                    } else {
                        await tryFetchRol(currentUser.id);
                    }
                } else {
                    setRol(null);
                    localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
                    localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
                }
            } catch (e) {
                console.error('[AuthContext] ❌ Error inesperado:', e);
                setUser(null);
                setRol(null);
                localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
                localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
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
                localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, currentUser.id);

                if (currentUser.app_metadata?.provider === 'google') {
                    const { data: perfil, error: perfilError } = await supabase
                        .from('perfiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .maybeSingle();

                    console.log("[AuthContext] perfil from supabase:", perfil, "error:", perfilError);

                    if (perfilError) {
                        console.warn("[AuthContext] Error leyendo perfil Google, usando rol localStorage");
                        const rolEnStorage = localStorage.getItem(LOCAL_STORAGE_USER_ROL_KEY);
                        setRol(rolEnStorage || null);
                        return;
                    }

                    if (!perfil) {
                        console.log("[AuthContext] Insertando nuevo perfil Google con rol alumno");
                        await supabase.from('perfiles').insert({
                            id: currentUser.id,
                            email: currentUser.email,
                            nombre: currentUser.user_metadata?.name || '',
                            avatar_url: currentUser.user_metadata?.avatar_url || '',
                            estado: 'Aprobado',
                            rol: 'alumno'
                        });
                        setRol('alumno');
                        localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, 'alumno');
                        return;
                    }

                    // perfil existente
                    if (perfil.rol) {
                        setRol(perfil.rol);
                        localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, perfil.rol);
                        return;
                    } else {
                        console.warn("[AuthContext] perfil sin rol, asignando alumno");
                        setRol('alumno');
                        localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, 'alumno');
                        return;
                    }
                }

                // usuario no Google
                const rolEnStorage = localStorage.getItem(LOCAL_STORAGE_USER_ROL_KEY);
                if (rolEnStorage) {
                    console.log("[AuthContext] No Google, rol desde localStorage:", rolEnStorage);
                    setRol(rolEnStorage);
                } else {
                    await tryFetchRol(currentUser.id);
                }
            } else {
                console.log('[AuthContext] 🔒 Usuario deslogueado');
                setUser(null);
                setRol(null);
                localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
                localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
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
        localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, userData?.id || '');
        localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, userRol || '');
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRol(null);
        localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
        localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, rol, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
