// src/hooks/useAuthWithRole.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAuthWithRole = () => {
    const [user, setUser] = useState(null);
    const [rol, setRol] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAndRole = async () => {
            const {
                data: { user }
            } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', user.id)
                    .single();

                if (error) console.error('Error rol:', error);
                else setRol(data?.rol);
            }

            setLoading(false);
        };

        fetchUserAndRole();
    }, []);

    return { user, rol, loading };
};
