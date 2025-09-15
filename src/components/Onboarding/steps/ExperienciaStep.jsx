import React from 'react';
import { 
    FaSeedling, 
    FaRunning, 
    FaMedal 
} from 'react-icons/fa';
import OptionCard from '../OptionCard';

const ExperienciaStep = ({ value, onChange }) => {
    const experiencias = [
        {
            id: 'principiante',
            title: 'Principiante',
            description: 'Recién empiezo o tengo poca experiencia entrenando',
            icon: FaSeedling
        },
        {
            id: 'intermedio',
            title: 'Intermedio',
            description: 'Tengo algunos meses o años de experiencia',
            icon: FaRunning
        },
        {
            id: 'avanzado',
            title: 'Avanzado',
            description: 'Tengo mucha experiencia y conocimiento en fitness',
            icon: FaMedal
        }
    ];

    return (
        <div className="space-y-4">
            {experiencias.map((experiencia) => (
                <OptionCard
                    key={experiencia.id}
                    title={experiencia.title}
                    description={experiencia.description}
                    icon={experiencia.icon}
                    selected={value === experiencia.id}
                    onClick={() => onChange(experiencia.id)}
                />
            ))}
        </div>
    );
};

export default ExperienciaStep;
