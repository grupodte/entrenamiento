// src/components/RutaProtegida.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RutaProtegida = ({ children, rolPermitido }) => {
    const { user, rol, loading } = useAuth();

    // Mostrar loader mientras se carga la sesión
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
                Cargando...
            </div>
        );
    }

    // Si no hay usuario, redirige al login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Si hay usuario pero el rol no coincide, redirige según su rol real
    if (rol !== rolPermitido) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RutaProtegida;
