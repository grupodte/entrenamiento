import React from 'react';
import AlumnoPerfilContent from '../AlumnoPerfilContent';

const RutinasAlumno = ({ 
    alumnoId, 
    alumno,
    asignacionesPorDia,
    rutinasBase,
    rutinasDeVerdad,
    fetchData,
    diasSemana,
    handleDrop,
    handleAssignRutinaDeVerdad,
    activeId,
    setActiveId,
    setIsDragging,
    sensors
}) => {
    return (
        <div>
            <AlumnoPerfilContent
                alumno={alumno}
                asignacionesPorDia={asignacionesPorDia}
                rutinasBase={rutinasBase}
                rutinasDeVerdad={rutinasDeVerdad}
                fetchData={fetchData}
                diasSemana={diasSemana}
                handleDrop={handleDrop}
                handleAssignRutinaDeVerdad={handleAssignRutinaDeVerdad}
                activeId={activeId}
                setActiveId={setActiveId}
                setIsDragging={setIsDragging}
                sensors={sensors}
            />
        </div>
    );
};

export default RutinasAlumno;
