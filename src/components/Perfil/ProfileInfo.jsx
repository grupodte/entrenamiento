import React from 'react';
import {
    FaEdit, FaUserCircle, FaBullseye, FaWeight,
    FaRulerVertical, FaPercentage, FaHeartbeat, FaSignOutAlt,
    FaMapMarkerAlt, FaBirthdayCake, FaPhone, FaEnvelope,
    FaCalendarAlt, FaFire, FaBalanceScale
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// Componente para métricas destacadas tipo red social
const MetricCard = ({ icon, label, value, accent = 'cyan' }) => {
    const accentColors = {
        cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
        green: 'text-green-400 bg-green-400/10 border-green-400/20',
        orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
        purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    };
    
    return (
        <div className={`flex flex-col items-center p-3 rounded-xl border ${accentColors[accent]} backdrop-blur-sm`}>
            <span className={`text-xl mb-1 ${accentColors[accent].split(' ')[0]}`}>{icon}</span>
            <p className="text-xs text-gray-400 text-center mb-1">{label}</p>
            <p className="text-sm font-bold text-white">{value || '-'}</p>
        </div>
    );
};

// Componente para información personal
const InfoItem = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-center space-x-3 py-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700/50">
                <span className="text-cyan-400 text-sm">{icon}</span>
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
            </div>
        </div>
    );
};

const ProfileInfo = ({ user, perfil, onEdit }) => {
    const avatarUrl = perfil?.avatar_url;
    const nombreCompleto = perfil?.nombre && perfil?.apellido 
        ? `${perfil.nombre} ${perfil.apellido}` 
        : perfil?.nombre || 'Usuario';
    const objetivo = perfil?.objetivo || "Definí tu objetivo";
    const biografia = perfil?.biografia;
    const email = user?.email;
    
    // Datos físicos
    const peso = perfil?.peso ? `${perfil.peso} kg` : null;
    const altura = perfil?.altura ? `${perfil.altura} cm` : null;
    const imc = perfil?.imc ? perfil.imc.toFixed(1) : null;
    const grasa = perfil?.porcentaje_grasa ? `${perfil.porcentaje_grasa.toFixed(1)}%` : null;
    
    // Información personal
    const edad = perfil?.edad ? `${perfil.edad} años` : null;
    const telefono = perfil?.telefono;
    const ubicacion = perfil?.ciudad && perfil?.pais 
        ? `${perfil.ciudad}, ${perfil.pais}` 
        : perfil?.ciudad || perfil?.pais;
    const fechaNacimiento = perfil?.fecha_nacimiento 
        ? new Date(perfil.fecha_nacimiento).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          })
        : null;
    
    // Metas y objetivos
    const metaPeso = perfil?.meta_peso ? `${perfil.meta_peso} kg` : null;
    const nivel = perfil?.nivel;
    const actividad = perfil?.actividad_fisica || perfil?.frecuencia_entrenamiento;

    return (
        <div className="flex flex-col space-y-6">
            {/* Header del Perfil - Estilo Red Social */}
            <div className="relative">
                {/* Cover/Background */}
                <div className="h-24 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-2 right-2">
                        <button
                            onClick={onEdit}
                            className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-200 flex items-center space-x-1"
                            title="Editar perfil"
                        >
                            <FaEdit className="text-white text-xs" />
                            <span className="text-white text-xs font-medium">Editar</span>
                        </button>
                    </div>
                </div>
                
                {/* Avatar */}
                <div className="absolute -bottom-8 left-4">
                    <div className="relative">
                        {avatarUrl ? (
                            <img 
                                src={avatarUrl} 
                                alt="Avatar" 
                                className="w-16 h-16 rounded-full border-4 border-gray-800 shadow-lg" 
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full border-4 border-gray-800 bg-gray-700 flex items-center justify-center shadow-lg">
                                <FaUserCircle className="text-2xl text-cyan-400" />
                            </div>
                        )}
                        {/* Status indicator */}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
                    </div>
                </div>
            </div>
            
            {/* Información Básica */}
            <div className="pt-8 space-y-3">
                <div>
                    <h1 className="text-xl font-bold text-white">{nombreCompleto}</h1>
                    <div className="flex items-center space-x-2 mt-1">
                        <FaBullseye className="text-cyan-400 text-xs" />
                        <p className="text-sm text-cyan-400 font-medium">{objetivo}</p>
                    </div>
                    {biografia && (
                        <p className="text-sm text-gray-300 mt-2 leading-relaxed">{biografia}</p>
                    )}
                </div>
                
                {/* Métricas Principales */}
                <div className="grid grid-cols-2 gap-3">
                    {peso && (
                        <MetricCard 
                            icon={<FaWeight />} 
                            label="Peso Actual" 
                            value={peso} 
                            accent="cyan" 
                        />
                    )}
                    {altura && (
                        <MetricCard 
                            icon={<FaRulerVertical />} 
                            label="Altura" 
                            value={altura} 
                            accent="green" 
                        />
                    )}
                    {imc && (
                        <MetricCard 
                            icon={<FaHeartbeat />} 
                            label="IMC" 
                            value={imc} 
                            accent="orange" 
                        />
                    )}
                    {grasa && (
                        <MetricCard 
                            icon={<FaPercentage />} 
                            label="% Grasa" 
                            value={grasa} 
                            accent="purple" 
                        />
                    )}
                </div>
                
                {/* Información Personal */}
                <div className="bg-gray-800/50 rounded-xl p-4 space-y-1">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                        <div className="w-1 h-4 bg-cyan-400 rounded-full" />
                        <span>Información Personal</span>
                    </h3>
                    
                    <InfoItem icon={<FaEnvelope />} label="Email" value={email} />
                    <InfoItem icon={<FaBirthdayCake />} label="Edad" value={edad} />
                    <InfoItem icon={<FaCalendarAlt />} label="Fecha de Nacimiento" value={fechaNacimiento} />
                    <InfoItem icon={<FaPhone />} label="Teléfono" value={telefono} />
                    <InfoItem icon={<FaMapMarkerAlt />} label="Ubicación" value={ubicacion} />
                    <InfoItem icon={<FaFire />} label="Nivel" value={nivel} />
                    <InfoItem icon={<FaBullseye />} label="Actividad" value={actividad} />
                    {metaPeso && <InfoItem icon={<FaBalanceScale />} label="Meta de Peso" value={metaPeso} />}
                </div>
            </div>
        </div>
    );
};

export default ProfileInfo;
