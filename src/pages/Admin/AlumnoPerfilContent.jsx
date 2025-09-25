import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import DiaCard from '../../components/Rutina/DiaCard';
import RutinasSidebar from '../../components/Rutina/RutinasSidebar';
import RutinaItem from '../../components/Rutina/RutinaItem';
import ComboboxRutinas from '../../components/Rutina/ComboboxRutinas';
import { toast } from 'react-hot-toast';
// Componentes de animación eliminados - usando motion directamente
import { motion } from 'framer-motion';
import {
    DndContext,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';

const AlumnoPerfilContent = ({
    alumno,
    asignacionesPorDia,
    rutinasBase,
    fetchData,
    diasSemana,
    handleDrop,
    handleAssignRutinaDeVerdad,
    activeId,
    setActiveId,
    setIsDragging,
    sensors,
    rutinasDeVerdad,
    onCloseDrawer // Prop para cerrar el drawer desde el contenido
}) => {
    const { id } = useParams(); // Este es el alumnoId
    const [selectedRutinaId, setSelectedRutinaId] = useState(null);

    const handleAssignClick = () => {
        if (selectedRutinaId) {
            handleAssignRutinaDeVerdad(selectedRutinaId);
        }
    };

    return (
        <div>
            <div className="p-4 bg-white/10 rounded-lg mb-6">
                <h2 className="text-lg font-bold text-white mb-2">Asignar Rutina Completa</h2>
                <div className="flex items-center gap-2">
                    <div className="flex-grow">
                        <ComboboxRutinas 
                            rutinasDisponibles={rutinasDeVerdad}
                            onSelect={setSelectedRutinaId}
                        />
                    </div>
                    <button 
                        onClick={handleAssignClick}
                        disabled={!selectedRutinaId}
                        className="px-4 py-2 rounded-md bg-blue-500 text-white font-semibold disabled:bg-gray-500 h-full"
                    >
                        Asignar
                    </button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={(event) => {
                    setActiveId(event.active.id);
                    setIsDragging(true);
                }}
                onDragEnd={(event) => {
                    handleDrop(event);
                    setIsDragging(false);
                }}
                onDragCancel={() => {
                    setActiveId(null);
                    setIsDragging(false);
                }}
                autoScroll={true}
            >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
                <div className="md:col-span-1">
                    <RutinasSidebar rutinas={rutinasBase} />
                </div>

                <div className="md:col-span-3">
                    <h1 className="text-2xl font-bold mb-4">
                        Rutinas de {alumno?.nombre} {alumno?.apellido}
                    </h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {diasSemana.map((dia, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <DiaCard
                                    index={i}
                                    id={`dia-${i}`}
                                    dia={dia}
                                    diaInfo={asignacionesPorDia[i]}
                                    alumnoId={id}
                                    onAsignacionEliminada={() => fetchData(true)}
                                    onRutinaPersonalizada={() => fetchData(true)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeId?.startsWith('rutina-') ? (
                    <motion.div
                        initial={{ scale: 1.1, opacity: 0.8 }}
                        animate={{ scale: 1.1, opacity: 0.8 }}
                        style={{ transform: 'rotate(5deg)' }}
                    >
                        <RutinaItem rutina={rutinasBase.find(r => `rutina-${r.id}` === activeId)} />
                    </motion.div>
                ) : null}
            </DragOverlay>
        </DndContext>
    </div>
    );
};

export default AlumnoPerfilContent;
