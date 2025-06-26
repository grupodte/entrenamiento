import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useAuthWithRole = () => {
    const [user, setUser] = useState(null);
    const [rol, setRol] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAndRole = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('[useAuthWithRole] ❌ Error sesión:', error);
                setUser(null);
                setRol(null);
                setLoading(false);
                return;
            }

            const currentUser = session?.user;
            setUser(currentUser);

            if (currentUser) {
                const { data, error: perfilError } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (perfilError) {
                    console.error('[useAuthWithRole] ❌ Error rol:', perfilError);
                    setRol(null);
                } else {
                    setRol(data?.rol || null);
                }
            } else {
                setRol(null);
            }

            setLoading(false);
        };

        fetchUserAndRole();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const updatedUser = session?.user || null;
            setUser(updatedUser);

            if (updatedUser) {
                supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', updatedUser.id)
                    .maybeSingle()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('[useAuthWithRole] ❌ Error rol post-login:', error);
                            setRol(null);
                        } else {
                            setRol(data?.rol || null);
                        }
                    });
            } else {
                setRol(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, rol, loading };
};
