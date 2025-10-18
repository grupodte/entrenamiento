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

    // Función para detectar si estamos en un flujo de recovery/reset password
    const isRecoveryFlow = () => {
        const hash = window.location.hash;
        const search = window.location.search;
        return hash.includes('type=recovery') || search.includes('type=recovery') || location.pathname === '/reset-pass';
    };

    const fetchRolAndOnboarding = async (user, skipOnboardingRedirect = false) => {
        if (!user) return;
        try {
            let { data, error } = await supabase
                .from("perfiles")
                .select("rol, onboarding_completed")
                .eq("id", user.id)
                .maybeSingle();
            
            if (error) throw error;

            // Si no existe el perfil, crearlo
            if (!data) {
                console.log("[AuthContext] Perfil no existe, creando nuevo perfil con datos de Google");

                // Procesar el nombre completo para dividirlo en nombre y apellido
                const fullName = user.user_metadata?.full_name || '';
                const nameParts = fullName.split(' ');
                const nombre = nameParts[0];
                const apellido = nameParts.slice(1).join(' ');

                const { data: newProfile, error: insertError } = await supabase
                    .from("perfiles")
                    .insert({
                        id: user.id,
                        rol: 'alumno', // rol por defecto
                        onboarding_completed: false,
                        // Datos del proveedor de OAuth (Google)
                        nombre: nombre,
                        apellido: apellido,
                        avatar_url: user.user_metadata?.avatar_url,
                        email: user.email,
                        // Campos a completar en onboarding
                        edad: null,
                        telefono: null,
                        genero: null,
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
                
                // Solo redirigir si NO estamos en un flujo de recovery y NO se solicita saltar la redirección
                const shouldRedirectToOnboarding = !skipOnboardingRedirect && 
                    !isRecoveryFlow() &&
                    data.onboarding_completed === false && 
                    location.pathname !== '/onboarding' && 
                    location.pathname !== '/reset-pass' &&
                    data.rol === 'alumno';
                
                if (shouldRedirectToOnboarding) {
                    console.log("[AuthContext] Redirigiendo a onboarding");
                    navigate('/onboarding', { replace: true });
                } else if (isRecoveryFlow()) {
                    console.log("[AuthContext] Flujo de recovery detectado, redirigiendo a reset-pass");
                    navigate('/reset-pass', { replace: true });
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
                
                // Detectar si estamos en flujo de recovery desde la inicialización
                const skipRedirect = isRecoveryFlow();
                console.log('[AuthContext] Init - Recovery flow detected:', skipRedirect);
                
                // no bloquear la carga con la query de rol
                fetchRolAndOnboarding(session.user, skipRedirect); // SIN AWAIT
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
            async (event, session) => {
                console.log('[AuthContext] Auth state change:', event, !!session?.user);
                
                if (session?.user) {
                    setUser(session.user);
                    localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, session.user.id);
                    
                    // Si es un evento de recovery, evitar redirección automática a onboarding
                    const skipRedirect = event === 'PASSWORD_RECOVERY' || isRecoveryFlow();
                    fetchRolAndOnboarding(session.user, skipRedirect); // SIN AWAIT
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
