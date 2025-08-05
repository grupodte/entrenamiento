import React from 'react';
import AlumnoPerfilContent from '../AlumnoPerfilContent';

const RutinasAlumno = ({ 
    alumnoId, 
    alumno,
    asignacionesPorDia,
    rutinasBase,
    fetchData,
    diasSemana,
    handleDrop,
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
                fetchData={fetchData}
                diasSemana={diasSemana}
                handleDrop={handleDrop}
                activeId={activeId}
                setActiveId={setActiveId}
                setIsDragging={setIsDragging}
                sensors={sensors}
            />
        </div>
    );
};

export default RutinasAlumno;
