import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RutaProtegida = ({ children, rolPermitido }) => {
    const { user, rol, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
                Cargando...
            </div>
        );
    }

    if (!user || rol !== rolPermitido) {
        return <Navigate to="/" />;
    }

    return children;
};

export default RutaProtegida;
