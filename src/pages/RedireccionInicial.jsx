// src/pages/RedireccionInicial.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RedireccionInicial = () => {
    const { user, rol, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (loading) return; // espera a que termine de cargar
        if (!user) navigate('/login');
        else if (rol === 'admin') navigate('/admin');
        else if (rol === 'alumno') navigate('/dashboard');
        else navigate('/login');
    }, [user, rol, loading, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
            Cargando...
        </div>
    );
};

export default RedireccionInicial;
