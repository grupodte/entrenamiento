import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [rol, setRol] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAndRol = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);

            if (data.user) {
                const { data: perfil } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', data.user.id)
                    .maybeSingle();

                setRol(perfil?.rol || null);
            } else {
                setRol(null);
            }

            setLoading(false);
        };

        fetchUserAndRol();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user;

            if (currentUser) {
                console.log('[AuthContext] ✅ Usuario logueado:', currentUser.email);
                setUser(currentUser);

                if (currentUser.app_metadata?.provider === 'google') {
                    console.log('[AuthContext] 🔍 Login con Google detectado');

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

                    if (perfilError) {
                        console.error('[AuthContext] ❌ Error obteniendo perfil:', perfilError);
                    }

                    if (!perfil) {
                        console.log('[AuthContext] 🆕 Insertando nuevo perfil con estado Aprobado...');
                        console.log('[AuthContext] 🔎 Datos insert:', { nombre, avatar_url });

                        const { error: insertError } = await supabase.from('perfiles').insert({
                            id: currentUser.id,
                            email: currentUser.email,
                            nombre,
                            avatar_url,
                            estado: 'Aprobado',
                            rol: 'alumno',
                        });

                        if (insertError) {
                            console.error('[AuthContext] ❌ Error al insertar perfil:', insertError);
                        }
                    } else {
                        const actualizaciones = {};
                        if (perfil.estado !== 'Aprobado') actualizaciones.estado = 'Aprobado';
                        if (!perfil.nombre && nombre) actualizaciones.nombre = nombre;
                        if (!perfil.avatar_url && avatar_url) actualizaciones.avatar_url = avatar_url;

                        if (Object.keys(actualizaciones).length > 0) {
                            console.log('[AuthContext] 🔁 Actualizando perfil con:', actualizaciones);
                            const { error: updateError } = await supabase
                                .from('perfiles')
                                .update(actualizaciones)
                                .eq('id', currentUser.id);

                            if (updateError) {
                                console.error('[AuthContext] ❌ Error al actualizar perfil:', updateError);
                            }
                        } else {
                            console.log('[AuthContext] ✅ Perfil ya aprobado y completo.');
                        }
                    }
                }

                const { data: perfilRol } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                setRol(perfilRol?.rol || null);
            } else {
                console.log('[AuthContext] 🔒 Usuario deslogueado');
                setUser(null);
                setRol(null);
            }
        });

        return () => subscription.unsubscribe();
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
