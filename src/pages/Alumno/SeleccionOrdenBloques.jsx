// src/pages/Alumno/SeleccionOrdenBloques.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import BrandedLoader from '../../components/BrandedLoader';

const SeleccionOrdenBloques = () => {
    const { id: rutinaId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { tipo } = location.state || {};

    const [bloques, setBloques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!rutinaId || !tipo) {
            setError("No se proporcionó ID de rutina o tipo.");
            setLoading(false);
            return;
        }

        const fetchBloques = async () => {
            setLoading(true);
            setError(null);

            let query = supabase.from('bloques');
            if (tipo === 'base') {
                query = query.select('id, nombre, orden, semana_inicio, semana_fin').eq('rutina_base_id', rutinaId);
            } else if (tipo === 'personalizada') {
                query = query.select('id, nombre, orden, semana_inicio, semana_fin').eq('rutina_personalizada_id', rutinaId);
            } else {
                setError("Tipo de rutina no válido.");
                setLoading(false);
                return;
            }

            const { data, error: dbError } = await query.order('orden', { ascending: true });

            if (dbError) {
                console.error("Error fetching bloques:", dbError);
                setError("Error al cargar los bloques de la rutina.");
                setBloques([]);
            } else {
                const bloquesConEtiquetas = (data || []).map((b, i) => ({
                    ...b,
                    nombre: b.nombre && b.nombre.trim() !== ""
                        ? b.nombre
                        : `Mes ${i + 1} (Semanas ${b.semana_inicio}-${b.semana_fin})`
                }));
                setBloques(bloquesConEtiquetas);
            }

            setLoading(false);
        };

        fetchBloques();
    }, [rutinaId, tipo]);

    const handleElegirBloque = (bloqueId) => {
        navigate(`/rutina/${rutinaId}?tipo=${tipo}&bloque=${bloqueId}`);
    };

    if (loading) return <BrandedLoader />;
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <p className="text-red-500 text-xl">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
                >
                    <FaArrowLeft className="mr-2" /> Volver
                </button>
            </div>
        );
    }

    if (bloques.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
                <p className="text-gray-700 text-xl mb-4">Esta rutina no tiene bloques definidos.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mt-4 flex items-center"
                >
                    <FaArrowLeft className="mr-2" /> Volver
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-inter pb-20">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between p-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                        <FaArrowLeft className="mr-2" /> Volver
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Elegir Mes de Entrenamiento</h1>
                    <div style={{ width: '60px' }}></div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6">
                <p className="text-gray-600 mb-6 text-center">
                    Selecciona con qué mes/semana querés empezar tu rutina:
                </p>

                <div className="space-y-4">
                    {bloques.map((bloque) => (
                        <div
                            key={bloque.id}
                            className="flex justify-between items-center bg-white shadow rounded-lg p-4 border"
                        >
                            <span className="text-lg font-semibold text-gray-700">
                                {bloque.nombre}
                            </span>
                            <button
                                onClick={() => handleElegirBloque(bloque.id)}
                                className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                            >
                                Iniciar <FaArrowRight className="ml-2" />
                            </button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default SeleccionOrdenBloques;
