// src/pages/Home.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OptimizedImage from '../components/OptimizedImage';
import bgImg from '../assets/men.jpg';
import { Link } from 'react-router-dom';

const Home = () => {
    const { user, rol } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && rol) {
            // Redirige según el rol del usuario logueado
            if (rol === 'alumno') {
                navigate('/dashboard');
            } else if (rol === 'admin') {
                navigate('/admin');
            }
        }
    }, [user, rol, navigate]);

    return (
        <section className="relative w-full flex items-center justify-center px-4 bg-gradient-to-b from-white to-gray-100 font-product">
            <div className="relative max-w-6xl w-full rounded-3xl overflow-hidden shadow-xl border border-gray-200">
                {/* Imagen de fondo con overlay */}
                <div className="absolute inset-0 z-0">
                    <OptimizedImage
                        src={bgImg}
                        alt="Fondo portada"
                        className="w-full h-full object-cover opacity-90"
                        loading="lazy"
                        decoding="async"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                </div>

                {/* Contenido centrado */}
                <div className="relative z-10 flex flex-col items-center justify-center text-white text-center px-6 py-24 md:py-36">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-md">
                        Tu nueva rutina empieza hoy
                    </h1>
                    <p className="mt-4 text-base sm:text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-sm">
                        Accedé a planes personalizados por tu entrenador y empezá a entrenar desde cualquier lugar.
                    </p>

                    <Link
                        to="/login"
                        className="mt-8 inline-block bg-white text-black font-semibold px-6 py-3 rounded-full text-base hover:bg-gray-100 transition shadow"
                    >
                        Ingresar como alumno
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Home;
