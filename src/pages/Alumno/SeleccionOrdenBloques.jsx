import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FaArrowLeft, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import BrandedLoader from '../../components/BrandedLoader';
import { motion } from 'framer-motion';
import { Drawer } from '../../components/Drawer';

const SeleccionOrdenBloques = ({ rutinaId, tipo, isOpen, onClose }) => {
    const navigate = useNavigate();
    const [bloques, setBloques] = useState([]);
    const [rutinaNombre, setRutinaNombre] = useState('');
    const [rutinaDescripcion, setRutinaDescripcion] = useState('');
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

            const fromTable = tipo === 'base' ? 'rutinas_base' : 'rutinas_personalizadas';
            const { data: rutinaData, error: rutinaError } = await supabase
                .from(fromTable)
                .select('nombre, descripcion')
                .eq('id', rutinaId)
                .single();
            
            if (rutinaError) console.error("Error fetching rutina nombre:", rutinaError);
            else {
                setRutinaNombre(rutinaData?.nombre || 'Rutina');
                setRutinaDescripcion(rutinaData?.descripcion || '');
            }

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

        if (isOpen) {
            fetchDatos();
        }
    }, [rutinaId, tipo, isOpen]);

    const handleElegirBloque = (bloqueId) => {
        onClose(); // Inicia la animación de cierre del panel
        // Espera a que la animación termine (aprox. 300ms) antes de navegar
        setTimeout(() => {
            navigate(`/rutina/${rutinaId}?tipo=${tipo}&bloque=${bloqueId}`);
        }, 300);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            <div className="bg-gray-800 text-white font-sans p-4">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-white">{rutinaNombre}</h1>
                    {rutinaDescripcion && <p className="text-sm text-gray-400 mt-1">{rutinaDescripcion}</p>}
                    <p className="text-sm text-gray-400">Selecciona un bloque</p>
                </div>

                {loading ? (
                    <BrandedLoader />
                ) : error ? (
                    <div className="text-center p-4 bg-red-900/50 rounded-lg text-sm">
                        <p className="text-red-300">{error}</p>
                    </div>
                ) : bloques.length === 0 ? (
                    <div className="text-center p-4 bg-gray-700 rounded-lg text-sm">
                        <p className="text-gray-300">Esta rutina no tiene bloques definidos.</p>
                    </div>
                ) : (
                    <motion.div 
                        className="space-y-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {bloques.map((bloque) => (
                            <motion.div key={bloque.id} variants={itemVariants}>
                                <div
                                    className="flex justify-between items-center bg-gray-700 shadow-lg rounded-xl p-4 border border-gray-600 hover:border-cyan-400 transition-colors duration-300"
                                >
                                    <div className="flex items-center gap-3">
                                        <FaCalendarAlt className="text-cyan-300 text-lg"/>
                                        <span className="text-base font-semibold text-white">
                                            {bloque.nombre}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleElegirBloque(bloque.id)}
                                        className="flex items-center bg-cyan-500 text-gray-900 font-bold px-3 py-1.5 rounded-lg hover:bg-cyan-400 transition-transform transform hover:scale-105 text-sm"
                                    >
                                        Iniciar <FaArrowRight className="ml-1 text-sm" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </Drawer>
    );
};

export default SeleccionOrdenBloques;
