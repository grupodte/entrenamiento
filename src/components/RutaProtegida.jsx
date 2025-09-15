import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const RutaProtegida = ({ children, rolPermitido, allowOnboarding = false }) => {
    const { user, rol, loading, onboardingCompleted } = useAuth();
    const location = useLocation();
    const rolPersistido = localStorage.getItem("authUserRol");

    const rolEvaluado = rol || rolPersistido;

    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;

    if (user && !rolEvaluado) return null;

    // Verificar onboarding para alumnos
    if (rolEvaluado === 'alumno' && onboardingCompleted === false && !allowOnboarding) {
        // Si no está en onboarding y no ha completado el onboarding, redirigir
        if (location.pathname !== '/onboarding') {
            return <Navigate to="/onboarding" replace />;
        }
    }

    if (rolPermitido && rolEvaluado !== rolPermitido) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RutaProtegida;
