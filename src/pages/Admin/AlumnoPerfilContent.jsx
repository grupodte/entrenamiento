import React from 'react';
import { useParams } from 'react-router-dom';
import DiaCard from '../../components/Rutina/DiaCard';
import RutinasSidebar from '../../components/Rutina/RutinasSidebar';
import RutinaItem from '../../components/Rutina/RutinaItem';
import { toast } from 'react-hot-toast';
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
    activeId,
    setActiveId,
    setIsDragging,
    sensors,
    onCloseDrawer // Prop para cerrar el drawer desde el contenido
}) => {
    const { id } = useParams(); // Este es el alumnoId

    return (
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
                            <DiaCard
                                key={i}
                                index={i}
                                id={`dia-${i}`}
                                dia={dia}
                                diaInfo={asignacionesPorDia[i]}
                                alumnoId={id}
                                onAsignacionEliminada={() => fetchData(true)}
                                onRutinaPersonalizada={() => fetchData(true)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeId?.startsWith('rutina-') ? (
                    <RutinaItem rutina={rutinasBase.find(r => `rutina-${r.id}` === activeId)} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default AlumnoPerfilContent;
