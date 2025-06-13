// src/context/AuthContext.jsx
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

            setLoading(false); // ✅ solo se marca como cargado una vez
        };

        fetchUserAndRol();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser(session.user);
                // Opción: podrías refrescar rol si querés más precisión
            } else {
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
