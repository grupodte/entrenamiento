import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [rol, setRol] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar usuario y rol al montar
    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            setUser(data.user);

            if (data.user) {
                const { data: perfil } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', data.user.id)
                    .single();

                setRol(perfil?.rol || null);
            }

            setLoading(false);
        };

        fetchUser();
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
