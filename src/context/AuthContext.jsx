import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const LOCAL_STORAGE_USER_ID_KEY = "authUserId";
const LOCAL_STORAGE_USER_ROL_KEY = "authUserRol";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // arranca con el rol guardado en localstorage de inmediato
    const [rol, setRol] = useState(localStorage.getItem(LOCAL_STORAGE_USER_ROL_KEY) || null);
    const [loading, setLoading] = useState(true);

    const fetchRol = async (userId) => {
        try {
            const { data, error } = await supabase
                .from("perfiles")
                .select("rol")
                .eq("id", userId)
                .maybeSingle();
            if (error) throw error;

            if (data?.rol) {
                setRol(data.rol);
                localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, data.rol);
            } else {
                setRol(null);
                localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
            }
        } catch (e) {
            console.error("[AuthContext] error consultando rol:", e);
            setRol(null);
            localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            setLoading(true);
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("[AuthContext] getSession error", error);
                setLoading(false);
                return;
            }

            if (session?.user) {
                if (isMounted) setUser(session.user);
                localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, session.user.id);
                // no bloquear la carga con la query de rol
                fetchRol(session.user.id); // SIN AWAIT
            } else {
                if (isMounted) {
                    setUser(null);
                    setRol(null);
                }
                localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
                localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
            }
            setLoading(false);
        };

        init();

        const { data: subscription } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, session.user.id);
                    fetchRol(session.user.id); // SIN AWAIT
                } else {
                    setUser(null);
                    setRol(null);
                    localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
                    localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.subscription.unsubscribe();
        };
    }, []);
    // Este loading es solo un estado booleano local para saber si está cargando algo en el contexto.
    // Si quieres mostrar un spinner visual, puedes crear un componente Loading.jsx en components
    // y usarlo en tu app donde uses useAuth y loading === true.

    const login = (userData, userRol) => {
        setLoading(true); // Start loading
        setTimeout(() => {
            setUser(userData);
            setRol(userRol);
            localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, userData.id);
            localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, userRol);
            setLoading(false); // End loading after delay
        }, 1000); // 1-second delay
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
