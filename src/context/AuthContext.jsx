import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
    const [onboardingCompleted, setOnboardingCompleted] = useState(null);
    
    const navigate = useNavigate();
    const location = useLocation();

    const fetchRolAndOnboarding = async (userId) => {
        try {
            let { data, error } = await supabase
                .from("perfiles")
                .select("rol, onboarding_completed")
                .eq("id", userId)
                .maybeSingle();
            
            if (error) throw error;

            // Si no existe el perfil, crearlo
            if (!data) {
                console.log("[AuthContext] Perfil no existe, creando nuevo perfil");
                const { data: newProfile, error: insertError } = await supabase
                    .from("perfiles")
                    .insert({
                        id: userId,
                        rol: 'alumno', // rol por defecto
                        onboarding_completed: false
                    })
                    .select("rol, onboarding_completed")
                    .single();
                
                if (insertError) throw insertError;
                data = newProfile;
            }

            if (data?.rol) {
                setRol(data.rol);
                setOnboardingCompleted(data.onboarding_completed ?? false);
                localStorage.setItem(LOCAL_STORAGE_USER_ROL_KEY, data.rol);
                
                // Redirigir a onboarding si no está completado y no estamos ya en esa ruta
                if (data.onboarding_completed === false && 
                    location.pathname !== '/onboarding' && 
                    data.rol === 'alumno') {
                    console.log("[AuthContext] Redirigiendo a onboarding");
                    navigate('/onboarding', { replace: true });
                }
            } else {
                setRol(null);
                setOnboardingCompleted(null);
                localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
            }
        } catch (e) {
            console.error("[AuthContext] error consultando perfil:", e);
            setRol(null);
            setOnboardingCompleted(null);
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
                fetchRolAndOnboarding(session.user.id); // SIN AWAIT
            } else {
                if (isMounted) {
                    setUser(null);
                    setRol(null);
                    setOnboardingCompleted(null);
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
                    fetchRolAndOnboarding(session.user.id); // SIN AWAIT
                } else {
                    setUser(null);
                    setRol(null);
                    setOnboardingCompleted(null);
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
        setOnboardingCompleted(null);
        localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
        localStorage.removeItem(LOCAL_STORAGE_USER_ROL_KEY);
    };
    
    // Función para actualizar el estado de onboarding
    const updateOnboardingStatus = (completed) => {
        setOnboardingCompleted(completed);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            rol, 
            loading, 
            onboardingCompleted, 
            login, 
            logout, 
            updateOnboardingStatus 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
