import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FaArrowLeft, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import BrandedLoader from '../../components/BrandedLoader';
import { motion } from 'framer-motion';

const SeleccionOrdenBloques = () => {
    const { id: rutinaId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { tipo } = location.state || {};

    const [bloques, setBloques] = useState([]);
    const [rutinaNombre, setRutinaNombre] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!rutinaId || !tipo) {
            setError("No se proporcionó ID de rutina o tipo.");
            setLoading(false);
            return;
        }

        const fetchDatos = async () => {
            setLoading(true);
            setError(null);

            // Fetch nombre de la rutina
            const fromTable = tipo === 'base' ? 'rutinas_base' : 'rutinas_personalizadas';
            const { data: rutinaData, error: rutinaError } = await supabase
                .from(fromTable)
                .select('nombre')
                .eq('id', rutinaId)
                .single();
            
            if (rutinaError) console.error("Error fetching rutina nombre:", rutinaError);
            else setRutinaNombre(rutinaData?.nombre || 'Rutina');

            // Fetch bloques
            let query = supabase.from('bloques');
            if (tipo === 'base') {
                query = query.select('id, nombre, orden, semana_inicio, semana_fin').eq('rutina_base_id', rutinaId);
            } else {
                query = query.select('id, nombre, orden, semana_inicio, semana_fin').eq('rutina_personalizada_id', rutinaId);
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

        fetchDatos();
    }, [rutinaId, tipo]);

    const handleElegirBloque = (bloqueId) => {
        navigate(`/rutina/${rutinaId}?tipo=${tipo}&bloque=${bloqueId}`);
    };

    if (loading) return <BrandedLoader />;
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
             <header className="sticky top-0 bg-gray-900/80 backdrop-blur-lg z-20 p-4 flex items-center gap-4 border-b border-gray-800">
                <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">{rutinaNombre}</h1>
                    <p className="text-sm text-gray-400">Selecciona un bloque</p>
                </div>
            </header>

            <main className="p-4 pb-24">
                {error ? (
                    <div className="text-center p-6 bg-red-900/50 rounded-lg">
                        <p className="text-red-300">{error}</p>
                    </div>
                ) : bloques.length === 0 ? (
                    <div className="text-center p-6 bg-gray-800 rounded-lg">
                        <p className="text-gray-300">Esta rutina no tiene bloques definidos.</p>
                    </div>
                ) : (
                    <motion.div 
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {bloques.map((bloque) => (
                            <motion.div key={bloque.id} variants={itemVariants}>
                                <div
                                    className="flex justify-between items-center bg-gray-800 shadow-lg rounded-xl p-5 border border-gray-700 hover:border-cyan-400 transition-colors duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <FaCalendarAlt className="text-cyan-300 text-xl"/>
                                        <span className="text-lg font-semibold text-white">
                                            {bloque.nombre}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleElegirBloque(bloque.id)}
                                        className="flex items-center bg-cyan-500 text-gray-900 font-bold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-transform transform hover:scale-105"
                                    >
                                        Iniciar <FaArrowRight className="ml-2" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default SeleccionOrdenBloques;
