import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Drawer from './Drawer';

const SeleccionBloquesMeses = ({ 
    programaId, 
    isOpen, 
    onClose,
    titulo = "Metabolico",
    descripcion = "Rutina lupa adaptada por lesión agosto 25",
    bloques = [
        { 
            id: 1, 
            nombre: "Mes 1", 
            detalle: "(Semanas 1-4)", 
            imagen: "/src/assets/select1.webp",
            color: "#F84B4B" // rojo
        },
        { 
            id: 2, 
            nombre: "Mes 2", 
            detalle: "(Semanas 5-8)", 
            imagen: "/src/assets/select2.webp",
            color: "#8B5CF6" // púrpura
        }
    ]
}) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleElegirBloque = (bloqueId) => {
        onClose(); // Inicia la animación de cierre del panel
        // Espera a que la animación termine (aprox. 300ms) antes de navegar
        setTimeout(() => {
            navigate(`/programa/${programaId}?mes=${bloqueId}`);
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

    // Función para generar colores dinámicos basados en el índice
    const getColorForIndex = (index) => {
        const colors = [
            "#F84B4B", // rojo
            "#8B5CF6", // púrpura
            "#10B981", // verde
            "#F59E0B", // amarillo
            "#EF4444", // rojo claro
            "#3B82F6"  // azul
        ];
        return colors[index % colors.length];
    };

    // Función para obtener la imagen basada en el índice (rotando entre las disponibles)
    const getImageForIndex = (index) => {
        const images = [
            "/src/assets/select1.webp",
            "/src/assets/select2.webp"
        ];
        return images[index % images.length];
    };

    // Si no se proporcionan bloques personalizados, generarlos dinámicamente
    const bloquesFinales = useMemo(() => {
        if (bloques.length > 0 && bloques[0].nombre !== "Mes 1") {
            // Si se proporcionan bloques personalizados, usarlos tal como están
            return bloques;
        }
        
        // Si son bloques por defecto o se necesita generar más, aplicar lógica dinámica
        return bloques.map((bloque, index) => ({
            ...bloque,
            color: bloque.color || getColorForIndex(index),
            imagen: bloque.imagen || getImageForIndex(index)
        }));
    }, [bloques]);

    return (
        <Drawer isOpen={isOpen} onClose={onClose} height="max-h-[85vh]">
            <div className="text-[#121212] max-w-full mx-auto leading-none flex flex-col">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-[27px] font-bold text-[#121212]">{titulo}</h1>
                    {descripcion && (
                        <p className="text-[13px] text-[#575757]">{descripcion}</p>
                    )}
                </div>

                {/* Grid scrolleable de bloques */}
                <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div 
                        className="flex gap-4 pb-4"
                        style={{
                            width: bloquesFinales.length <= 2 ? '100%' : `${bloquesFinales.length * 396}px`
                        }}
                    >
                        <motion.div
                            className="flex gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {bloquesFinales.map((bloque, index) => (
                                <motion.div 
                                    key={bloque.id} 
                                    variants={itemVariants}
                                    className="flex-shrink-0"
                                    style={{ width: '380px', height: '290px' }}
                                >
                                    <button
                                        onClick={() => handleElegirBloque(bloque.id)}
                                        className="w-full h-full relative rounded-2xl shadow-lg overflow-hidden group transition-transform duration-300 hover:scale-105"
                                    >
                                        {/* Imagen de fondo */}
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                            style={{
                                                backgroundImage: `url(${bloque.imagen})`
                                            }}
                                        />
                                        
                                        {/* Overlay oscuro */}
                                        <div className="absolute inset-0 bg-black/50" />
                                        
                                        {/* Contenido */}
                                        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white">
                                            <span 
                                                className="text-6xl font-bold mb-2"
                                                style={{ color: bloque.color }}
                                            >
                                                {bloque.nombre}
                                            </span>
                                            <p className="text-xl text-gray-300 mb-6">
                                                {bloque.detalle}
                                            </p>
                                            
                                            {/* Botón de flecha */}
                                            <div 
                                                className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-200"
                                                style={{ 
                                                    backgroundColor: bloque.color,
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
                </div>

                {/* Indicadores de scroll para más de 2 bloques */}
                {bloquesFinales.length > 2 && (
                    <div className="flex justify-center mt-4">
                        <div className="flex space-x-2">
                            {bloquesFinales.map((_, index) => (
                                <div
                                    key={index}
                                    className="w-2 h-2 rounded-full bg-gray-400 opacity-60"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Drawer>
    );
};

export default SeleccionBloquesMeses;
