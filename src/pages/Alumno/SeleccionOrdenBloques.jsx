import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Drawer from '../../components/Drawer';
import { useRutinaCache } from '../../hooks/useRutinaCache';

const SeleccionOrdenBloques = ({ rutinaId, tipo, isOpen, onClose }) => {
    const navigate = useNavigate();
    const { fetchRutinaData, loading: cacheLoading } = useRutinaCache();
    const [rutinaData, setRutinaData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Usar useMemo para evitar recálculos innecesarios
    const shouldFetch = useMemo(() => {
        return isOpen && rutinaId && tipo && (!rutinaData || rutinaData.rutina.id !== rutinaId);
    }, [isOpen, rutinaId, tipo, rutinaData]);

    // Optimizar la carga de datos
    const loadRutinaData = useCallback(async () => {
        if (!shouldFetch) return;

        setLoading(true);

        const data = await fetchRutinaData(rutinaId, tipo);
        setRutinaData(data);
        setLoading(false);
    }, [shouldFetch, fetchRutinaData, rutinaId, tipo]);

    useEffect(() => {
        if (!rutinaId || !tipo) {
            return;
        }

        loadRutinaData();
    }, [loadRutinaData, rutinaId, tipo]);

    const handleElegirBloque = (bloqueId) => {
        onClose(); // Inicia la animación de cierre del panel
        // Espera a que la animación termine (aprox. 300ms) antes de navegar
        setTimeout(() => {
            navigate(`/rutina/${rutinaId}?bloque=${bloqueId}`, { state: { tipo: tipo } });
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

    // Mostrar el loader mientras se cargan los datos
    const isLoading = loading || cacheLoading;

    return (
        <Drawer isOpen={isOpen} onClose={onClose} height="h-[95vh]">
            {rutinaData ? (
                    <div className=" text-[#121212] max-w-full mx-auto leading-none flex flex-item flex-col  ">
                    <div className="mb-4">
                            <h1 className="text-[27px] font-bold text-[#121212]">{rutinaData.rutina.nombre}</h1>
                        {rutinaData.rutina.descripcion && (
                                <p className="text-[13px] text-[#575757]">{rutinaData.rutina.descripcion}</p>
                        )}
                    </div>

                    {rutinaData.bloques.length === 0 ? (
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
                            {rutinaData.bloques.map((bloque) => (
                                <motion.div key={bloque.id} variants={itemVariants}>
                                    <button
                                        onClick={() => handleElegirBloque(bloque.id)}
                                        className="w-full h-[212px] flex justify-between items-center bg-[#121212] shadow-lg rounded-xl p-4 "
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-[27px] font-bold text-[#F84B4B]">
                                                {bloque.nombre}
                                            </span>
                                        </div>
                                        <ChevronRight className="text-cyan-400 text-lg transition-transform group-hover:translate-x-1" />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            ) : null}
        </Drawer>
    );
};

export default SeleccionOrdenBloques;
