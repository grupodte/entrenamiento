import React, { useState } from 'react';
import SeleccionBloquesMeses from '../SeleccionBloquesMeses';

const EjemploSeleccionMeses = () => {
    const [isOpen2Meses, setIsOpen2Meses] = useState(false);
    const [isOpen4Meses, setIsOpen4Meses] = useState(false);
    const [isOpen6Meses, setIsOpen6Meses] = useState(false);

    // Ejemplo con 2 meses (por defecto)
    const bloques2Meses = [
        { 
            id: 1, 
            nombre: "Mes 1", 
            detalle: "(Semanas 1-4)", 
            imagen: "/src/assets/select1.webp",
            color: "#F84B4B"
        },
        { 
            id: 2, 
            nombre: "Mes 2", 
            detalle: "(Semanas 5-8)", 
            imagen: "/src/assets/select2.webp",
            color: "#8B5CF6"
        }
    ];

    // Ejemplo con 4 meses
    const bloques4Meses = [
        { 
            id: 1, 
            nombre: "Mes 1", 
            detalle: "(Semanas 1-4)", 
            imagen: "/src/assets/select1.webp",
            color: "#F84B4B"
        },
        { 
            id: 2, 
            nombre: "Mes 2", 
            detalle: "(Semanas 5-8)", 
            imagen: "/src/assets/select2.webp",
            color: "#8B5CF6"
        },
        { 
            id: 3, 
            nombre: "Mes 3", 
            detalle: "(Semanas 9-12)", 
            imagen: "/src/assets/select1.webp",
            color: "#10B981"
        },
        { 
            id: 4, 
            nombre: "Mes 4", 
            detalle: "(Semanas 13-16)", 
            imagen: "/src/assets/select2.webp",
            color: "#F59E0B"
        }
    ];

    // Ejemplo con 6 meses
    const bloques6Meses = [
        { 
            id: 1, 
            nombre: "Mes 1", 
            detalle: "(Semanas 1-4)", 
            imagen: "/src/assets/select1.webp",
            color: "#F84B4B"
        },
        { 
            id: 2, 
            nombre: "Mes 2", 
            detalle: "(Semanas 5-8)", 
            imagen: "/src/assets/select2.webp",
            color: "#8B5CF6"
        },
        { 
            id: 3, 
            nombre: "Mes 3", 
            detalle: "(Semanas 9-12)", 
            imagen: "/src/assets/select1.webp",
            color: "#10B981"
        },
        { 
            id: 4, 
            nombre: "Mes 4", 
            detalle: "(Semanas 13-16)", 
            imagen: "/src/assets/select2.webp",
            color: "#F59E0B"
        },
        { 
            id: 5, 
            nombre: "Mes 5", 
            detalle: "(Semanas 17-20)", 
            imagen: "/src/assets/select1.webp",
            color: "#EF4444"
        },
        { 
            id: 6, 
            nombre: "Mes 6", 
            detalle: "(Semanas 21-24)", 
            imagen: "/src/assets/select2.webp",
            color: "#3B82F6"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">
                    Ejemplos de Selección de Meses
                </h1>

                <div className="space-y-4">
                    <button
                        onClick={() => setIsOpen2Meses(true)}
                        className="w-full p-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    >
                        Abrir Programa de 2 Meses
                    </button>

                    <button
                        onClick={() => setIsOpen4Meses(true)}
                        className="w-full p-4 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
                    >
                        Abrir Programa de 4 Meses
                    </button>

                    <button
                        onClick={() => setIsOpen6Meses(true)}
                        className="w-full p-4 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                    >
                        Abrir Programa de 6 Meses
                    </button>
                </div>

                {/* Componentes de selección */}
                <SeleccionBloquesMeses
                    programaId="programa-2-meses"
                    isOpen={isOpen2Meses}
                    onClose={() => setIsOpen2Meses(false)}
                    titulo="Metabolico - Programa Básico"
                    descripcion="Rutina lupa adaptada por lesión agosto 25"
                    bloques={bloques2Meses}
                />

                <SeleccionBloquesMeses
                    programaId="programa-4-meses"
                    isOpen={isOpen4Meses}
                    onClose={() => setIsOpen4Meses(false)}
                    titulo="Metabolico - Programa Intermedio"
                    descripcion="Rutina avanzada de 4 meses para transformación completa"
                    bloques={bloques4Meses}
                />

                <SeleccionBloquesMeses
                    programaId="programa-6-meses"
                    isOpen={isOpen6Meses}
                    onClose={() => setIsOpen6Meses(false)}
                    titulo="Metabolico - Programa Avanzado"
                    descripcion="Rutina completa de 6 meses para máximos resultados"
                    bloques={bloques6Meses}
                />
            </div>
        </div>
    );
};

export default EjemploSeleccionMeses;
