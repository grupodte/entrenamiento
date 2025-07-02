import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandedLoader from './BrandedLoader';

const RutaProtegida = ({ children, rolPermitido }) => {
    const { user, rol, loading } = useAuth();

    // detectar valor guardado
    const rolLocal = localStorage.getItem('authUserRol');

    // Mientras cargamos
    if (loading || (user && rol === null && !rolLocal)) {
        return <BrandedLoader />;
    }

    if (!user) return <Navigate to="/login" replace />;

    // priorizar rol reactivo o localStorage
    const rolEvaluado = rol || rolLocal;

    if (rolEvaluado !== rolPermitido) return <Navigate to="/" replace />;

    return children;
};


export default RutaProtegida;
