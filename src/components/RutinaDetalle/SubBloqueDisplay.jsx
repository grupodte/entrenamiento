import React from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaFire, FaSyncAlt } from 'react-icons/fa';

const SubBloqueDisplay = (props) => {
    const { subbloque, isCompleted, isInProgress, lastSessionData } = props;
    console.log(`SubBloqueDisplay - SubBloque ${subbloque.nombre || subbloque.id} received isCompleted: ${isCompleted}, isInProgress: ${isInProgress}`);

    const Icon = subbloque.tipo === 'superset' ? FaSyncAlt : FaFire;

    let circleColorClass = 'bg-gray-800 border-gray-700'; // Default: not started
    if (isCompleted) {
        circleColorClass = 'bg-green-400 border-green-400'; // Completed
    } else if (isInProgress) {
        circleColorClass = 'bg-cyan-400 border-cyan-400'; // In progress
    }

    return (
        <div className="relative pl-5">
            <div className={`absolute left-1 top-2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 transition-colors duration-300 ${circleColorClass}`}></div>
            <div className="mb-3">
                <h3 className={`text-base font-semibold flex items-center gap-2 ${subbloque.tipo === "superset" ? "text-purple-300" : "text-amber-300"}`}>
                    <Icon />
                    {subbloque.nombre || "Sub-bloque"}
                </h3>
            </div>

            <div className="space-y-2">
                {subbloque.tipo === 'simple' && subbloque.subbloques_ejercicios?.map(sbe => (
                    <EjercicioSimpleDisplay
                        key={sbe.id}
                        sbe={sbe}
                        subbloqueId={subbloque.id}
                        {...props}
                        lastSessionData={lastSessionData}
                    />
                ))}

                {subbloque.tipo === 'superset' && (
                    <SupersetDisplay
                        subbloque={subbloque}
                        {...props}
                        lastSessionData={lastSessionData}
                    />
                )}
            </div>
        </div>
    );
};

export default SubBloqueDisplay;
