import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const RutaProtegida = ({ children, rolPermitido }) => {
    const { user, rol, loading } = useAuth();
    const rolPersistido = localStorage.getItem("authUserRol");

    const rolEvaluado = rol || rolPersistido;

    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;

    if (user && !rolEvaluado) return null;

    if (rolPermitido && rolEvaluado !== rolPermitido) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RutaProtegida;
