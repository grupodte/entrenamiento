import React from 'react';
import { 
    FaFire, 
    FaDumbbell, 
    FaBalanceScale, 
    FaTrophy 
} from 'react-icons/fa';
import OptionCard from '../OptionCard';

const ObjetivoStep = ({ value, onChange }) => {
    const objetivos = [
        {
            id: 'perder_peso',
            title: 'Perder peso',
            description: 'Quemar grasa y reducir el peso corporal',
            icon: FaFire
        },
        {
            id: 'ganar_musculo',
            title: 'Ganar músculo',
            description: 'Aumentar masa muscular y fuerza',
            icon: FaDumbbell
        },
        {
            id: 'mantenimiento',
            title: 'Mantenerme en forma',
            description: 'Mantener mi condición física actual',
            icon: FaBalanceScale
        },
        {
            id: 'rendimiento',
            title: 'Mejorar rendimiento',
            description: 'Optimizar mi rendimiento deportivo',
            icon: FaTrophy
        }
    ];

    return (
        <div className="space-y-4">
            {objetivos.map((objetivo) => (
                <OptionCard
                    key={objetivo.id}
                    title={objetivo.title}
                    description={objetivo.description}
                    icon={objetivo.icon}
                    selected={value === objetivo.id}
                    onClick={() => onChange(objetivo.id)}
                />
            ))}
        </div>
    );
};

export default ObjetivoStep;
