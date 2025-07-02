import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export const useAuthUser = () => {
    const { user, rol, loading } = useAuth();
    const [perfil, setPerfil] = useState(null);
    const [loadingPerfil, setLoadingPerfil] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!loading && user) {
            setLoadingPerfil(true);
            supabase
                .from("perfiles")
                .select("*")
                .eq("id", user.id)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.error("[useAuthUser] error perfil", error);
                        setPerfil(null);
                        setError(error);
                    } else {
                        setPerfil(data);
                    }
                    setLoadingPerfil(false);
                });
        } else if (!loading && !user) {
            setPerfil(null);
            setLoadingPerfil(false);
        }
    }, [user, loading]);

    return {
        user,
        rol,
        perfil,
        isLoading: loading || loadingPerfil,
        error,
    };
};
