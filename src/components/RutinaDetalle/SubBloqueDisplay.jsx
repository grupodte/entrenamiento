import React from 'react';
import EjercicioSimpleDisplay from './EjercicioSimpleDisplay';
import SupersetDisplay from './SupersetDisplay';
import { FaFire, FaSyncAlt } from 'react-icons/fa';

const SubBloqueDisplay = (props) => {
    const { subbloque } = props;

    const Icon = subbloque.tipo === 'superset' ? FaSyncAlt : FaFire;

    return (
        <div className="relative pl-8">
            <div className="absolute left-3 top-4 -translate-x-1/2 w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-900"></div>
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
                    />
                ))}

                {subbloque.tipo === 'superset' && (
                    <SupersetDisplay
                        subbloque={subbloque}
                        {...props}
                    />
                )}
            </div>
        </div>
    );
};

export default SubBloqueDisplay;
