import React from 'react';
import { 
    FaCalendarCheck, 
    FaGraduationCap, 
    FaCompass 
} from 'react-icons/fa';
import OptionCard from '../OptionCard';

const PreferenciasStep = ({ value, onChange }) => {
    const preferencias = [
        {
            id: 'rutina',
            title: 'Comenzar con una rutina',
            description: 'Quiero empezar con un plan de ejercicios estructurado',
            icon: FaCalendarCheck
        },
        {
            id: 'cursos',
            title: 'Explorar cursos',
            description: 'Prefiero aprender con cursos y contenido educativo',
            icon: FaGraduationCap
        },
        {
            id: 'explorar',
            title: 'Explorar la plataforma',
            description: 'Quiero navegar y conocer todas las opciones disponibles',
            icon: FaCompass
        }
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
                <p className="text-sm text-white/80">
                    <strong className="text-cyan-400">¡Casi terminamos!</strong> ¿Cómo te gustaría empezar tu experiencia?
                </p>
            </div>

            <div className="space-y-4">
                {preferencias.map((preferencia) => (
                    <OptionCard
                        key={preferencia.id}
                        title={preferencia.title}
                        description={preferencia.description}
                        icon={preferencia.icon}
                        selected={value === preferencia.id}
                        onClick={() => onChange(preferencia.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default PreferenciasStep;
