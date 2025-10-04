import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Drawer from '../../components/Drawer';
import { useRutinaCache } from '../../hooks/useRutinaCache';

// Importar imágenes correctamente
import arrow from '../../assets/arrow.svg';
import select1Image from '../../assets/select1.webp';
import select2Image from '../../assets/select2.webp';


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
            select1Image,
            select2Image
        ];
        return images[index % images.length];
    };

    // Mostrar el loader mientras se cargan los datos
    const isLoading = loading || cacheLoading;

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            <div className="h-full flex flex-col">
                {rutinaData ? (
                    <>
                        {/* Header fijo */}
                        <div className="flex-shrink-0 mb-6 text-center px-4 pt-4 leading-none justify-center flex flex-col">
                            <h1 className="text-[34px] font-bold text-[#121212] mb-2">{rutinaData.rutina.nombre}</h1>
                            {rutinaData.rutina.descripcion && (
                                <p className="text-[13px] text-[#575757]">{rutinaData.rutina.descripcion}</p>
                            )}
                        </div>

                        {/* Contenido con scroll */}
                        <div 
                            className="text-[#121212] w-full mx-auto leading-none drawer-content pb-10 pt-5 flex-1 overflow-y-auto"
                        style={{
                            overscrollBehavior: 'contain',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch',
                            touchAction: 'pan-y'
                        }}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        {rutinaData.bloques.length === 0 ? (
                            <div className="text-center p-4 bg-gray-700 rounded-lg text-sm">
                                <p className="text-gray-300">Esta rutina no tiene bloques definidos.</p>
                            </div>
                        ) : (
                            <motion.div
                                className="grid grid-cols-1 gap-1 pb-20" 
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {rutinaData.bloques.map((bloque, index) => (
                                    <motion.div 
                                        key={bloque.id} 
                                        variants={itemVariants}
                                        className="w-full flex justify-center"
                                    >
                                        <div
                                            onClick={() => handleElegirBloque(bloque.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    handleElegirBloque(bloque.id);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            className="w-full max-w-[380px] h-[290px] relative rounded-2xl  overflow-hidden cursor-pointer"
                                        >
                                            {/* Imagen de fondo */}
                                            <div 
                                                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                                style={{
                                                    backgroundImage: `url(${getImageForIndex(index)})`,
                                                    backgroundColor: '#1f1f1f', // Fallback color
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    backgroundRepeat: 'no-repeat',
                                                    imageRendering: 'crisp-edges'
                                                }}
                                                onError={(e) => {
                                                    console.warn('Error loading background image:', getImageForIndex(index));
                                                    e.target.style.backgroundColor = '#1f1f1f';
                                                }}
                                            />

                                            {/* Contenido centrado */}
                                            <div className="relative z-10 h-full flex flex-col justify-center items-center text-white ">
                                                <div className="text-center">
                                                    <div
                                                        className="text-[57px] font-bold leading-none"
                                                        style={{ color: getColorForIndex(index) }}
                                                    >
                                                        {bloque.nombre.split('(')[0].trim()}
                                                    </div>
                                                    {bloque.nombre.includes('(') && (
                                                        <div className="text-[27px] text-gray-300 mb-4">
                                                            ({bloque.nombre.split('(')[1]}
                                                        </div>
                                                    )}
                                                </div>

                                                {bloque.detalle && (
                                                    <p className="text-[12px] text-[#FFFFFF] mb-4">{bloque.detalle}</p>
                                                )}

                                                {/* Botón flecha */}
                                                <div
                                                    className="w-[50px] h-[50px] rounded-lg flex items-center justify-center transition-colors duration-200"
                                                    style={{
                                                        backgroundColor: getColorForIndex(index),
                                                    }}
                                                >
                                                    <img className='w-[22px]' src={arrow} alt="arrow" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </Drawer>
    );
};

export default SeleccionOrdenBloques;
