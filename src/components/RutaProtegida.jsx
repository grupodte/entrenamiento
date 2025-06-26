import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandedLoader from './BrandedLoader';

const RutaProtegida = ({ children, rolPermitido }) => {
    const { user, rol, loading } = useAuth();

    // Esperar a que todo esté definido
    if (loading || (user && rol === null)) {
        return <BrandedLoader />;
    }

    if (!user) return <Navigate to="/login" replace />;
    if (rol !== rolPermitido) return <Navigate to="/" replace />;

    return children;
};

export default RutaProtegida;
