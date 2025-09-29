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

    // Colores rotativos para diferenciar meses/bloques
    const getColorForIndex = (index) => {
        const colors = [
            '#FF0000', // rojo
            '#8941FF', // púrpura
            '#10B981', // verde
            '#F59E0B', // amarillo
            '#EF4444', // rojo claro
            '#3B82F6'  // azul
        ];
        return colors[index % colors.length];
    };

    // Alterna entre select1 y select2
    const getImageForIndex = (index) => {
        const images = [
            '/src/assets/select1.webp',
            '/src/assets/select2.webp'
        ];
        return images[index % images.length];
    };

    // Mostrar el loader mientras se cargan los datos
    const isLoading = loading || cacheLoading;

    return (
        <Drawer isOpen={isOpen} onClose={onClose} height="h-[100vh] ">
     
            {rutinaData ? (
                    <div className=" text-[#121212] w-[380px] mx-auto leading-none flex flex-item flex-col">
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
                        <>
                        {/* Grid responsivo en móvil, scroll horizontal en desktop */}
                        <div className="block sm:hidden">
                            {/* Versión móvil: Grid vertical */}
                            <motion.div
                                className="grid grid-cols-1 gap-4"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {rutinaData.bloques.map((bloque, index) => (
                                    <motion.div 
                                        key={bloque.id} 
                                        variants={itemVariants}
                                        className="w-full"
                                    >
                                        <button
                                            onClick={() => handleElegirBloque(bloque.id)}
                                            className=" w-[380px] h-[290px] relative rounded-2xl shadow-lg overflow-hidden "
                                        >
                                            {/* Imagen de fondo */}
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                                style={{
                                                    backgroundImage: `url(${getImageForIndex(index)})`
                                                }}
                                            />


                                            {/* Contenido centrado */}
                                            <div className="relative z-10 h-full flex flex-col justify-center items-center text-white ">
                                                <div className="text-center">
                                                    <div
                                                        className="text-[60px] font-bold leading-none"
                                                        style={{ color: getColorForIndex(index) }}
                                                    >
                                                        {bloque.nombre.split('(')[0].trim()}
                                                    </div>
                                                    {bloque.nombre.includes('(') && (
                                                        <div className="text-[16px] text-gray-300 mb-4">
                                                            ({bloque.nombre.split('(')[1]}
                                                        </div>
                                                    )}
                                                </div>

                                                {bloque.detalle && (
                                                    <p className="text-[12px] text-[#FFFFFF] mb-4">{bloque.detalle}</p>
                                                )}

                                                {/* Botón flecha */}
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200"
                                                    style={{
                                                        backgroundColor: getColorForIndex(index),
                                                        filter: 'brightness(0.9)'
                                                    }}
                                                >
                                                    <ChevronRight className="text-white text-lg transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Versión desktop y tablet: Scroll horizontal */}
                        <div className="hidden sm:block overflow-x-auto scrollbar-hide -mx-1 px-1">
                            <motion.div
                                className="flex gap-4 pb-2"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {rutinaData.bloques.map((bloque, index) => (
                                    <motion.div 
                                        key={bloque.id} 
                                        variants={itemVariants}
                                        className="flex-shrink-0"
                                        style={{ width: '380px', height: '290px' }}
                                    >
                                        <button
                                            onClick={() => handleElegirBloque(bloque.id)}
                                            className="w-full h-full relative rounded-2xl shadow-lg overflow-hidden group "
                                        >
                                            {/* Imagen de fondo */}
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                                style={{
                                                    backgroundImage: `url(${getImageForIndex(index)})`
                                                }}
                                            />

                                            {/* Contenido centrado */}
                                            <div className="relative z-10 h-full flex flex-col justify-center items-center text-white">
                                                <div className="text-center">
                                                    <div
                                                        className="text-[60px] font-bold leading-tight"
                                                        style={{ color: getColorForIndex(index) }}
                                                    >
                                                        {bloque.nombre.split('(')[0].trim()}
                                                    </div>
                                                    {bloque.nombre.includes('(') && (
                                                        <div className="text-[16px] text-gray-300 mb-4">
                                                            ({bloque.nombre.split('(')[1]}
                                                        </div>
                                                    )}
                                                </div>

                                                {bloque.detalle && (
                                                    <p className="text-[12px] text-[#FFFFFF] mb-4">{bloque.detalle}</p>
                                                )}

                                                {/* Botón flecha */}
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200"
                                                    style={{
                                                        backgroundColor: getColorForIndex(index),
                                                        filter: 'brightness(0.9)'
                                                    }}
                                                >
                                                    <ChevronRight className="text-white text-lg transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Indicadores de scroll para desktop (solo cuando hay más de 2 bloques) */}
                        <div className="hidden sm:block">
                            {rutinaData.bloques.length > 2 && (
                                <div className="flex justify-center mt-4">
                                    <div className="flex space-x-2">
                                        {rutinaData.bloques.map((_, index) => (
                                            <div
                                                key={index}
                                                className="w-2 h-2 rounded-full bg-gray-400 opacity-60"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        </>
                    )}
                </div>
            ) : null}
        </Drawer>
    );
};

export default SeleccionOrdenBloques;
