// src/components/RutaProtegida.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandedLoader from './BrandedLoader';

const RutaProtegida = ({ children, rolPermitido }) => {
    const { user, rol, loading } = useAuth();

    if (loading) {
        return <BrandedLoader />;
    }

    if (!user) return <Navigate to="/login" replace />;
    if (rol !== rolPermitido) return <Navigate to="/" replace />;

    return children;
};

export default RutaProtegida;
