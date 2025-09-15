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
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-sm text-green-300">
                    <strong>¡Casi terminamos!</strong> ¿Cómo te gustaría empezar tu experiencia en Fit?
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
