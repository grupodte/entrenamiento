import React from 'react';
import {
    FaEdit, FaUserCircle, FaBullseye, FaWeight,
    FaRulerVertical, FaPercentage, FaHeartbeat, 
    FaFire, FaBalanceScale, FaChartLine,
    FaDumbbell, FaCalendarCheck
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
    
    // Datos físicos (usando nombres correctos de la BD)
    const peso = perfil?.peso_kg ? parseFloat(perfil.peso_kg) : null;
    const altura = perfil?.altura_cm ? parseInt(perfil.altura_cm) : null;
    const imc = peso && altura ? ((peso / Math.pow(altura / 100, 2)).toFixed(1)) : null;
    const grasa = perfil?.grasa_pct ? `${parseFloat(perfil.grasa_pct).toFixed(1)}%` : null;
    
    // Metas y objetivos
    const metaPeso = perfil?.meta_peso ? parseFloat(perfil.meta_peso) : null;
    const experiencia = perfil?.experiencia;
    
    // Cálculo de categoría de IMC
    const getIMCCategory = (imcValue) => {
        if (!imcValue) return null;
        const imc = parseFloat(imcValue);
        if (imc < 18.5) return { text: 'Bajo peso', color: 'text-blue-400' };
        if (imc < 25) return { text: 'Normal', color: 'text-green-400' };
        if (imc < 30) return { text: 'Sobrepeso', color: 'text-yellow-400' };
        return { text: 'Obesidad', color: 'text-red-400' };
    };
    
    const imcCategoria = getIMCCategory(imc);

    return (
        <div className="flex flex-col space-y-6">
            {/* Header con Avatar Centrado (sin portada) */}
            <div className="relative pt-4">
                {/* Botón Editar */}
                <button
                    onClick={onEdit}
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-700/80 hover:bg-gray-600 transition-all duration-200 shadow-lg z-10"
                    title="Editar perfil"
                >
                    <FaEdit className="text-cyan-400 text-sm" />
                </button>
                
                {/* Avatar Centrado */}
                <div className="flex flex-col items-center pb-2">
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt="Avatar" 
                            className="w-20 h-20 rounded-full border-3 border-cyan-500 shadow-xl" 
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center border-3 border-gray-600 shadow-xl">
                            <FaUserCircle className="text-4xl text-cyan-400" />
                        </div>
                    )}
                    
                    {/* Nombre Discreto */}
                    <h1 className="text-lg font-medium text-gray-300 mt-3 mb-1">{nombreCompleto}</h1>
                </div>
            </div>
            
            <div className="space-y-5">
                {/* Objetivo Principal Destacado */}
                {objetivo && objetivo !== "Definí tu objetivo" && (
                    <div className="bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/25 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <FaBullseye className="text-cyan-400 text-lg" />
                            </div>
                            <div>
                                <p className="text-sm text-cyan-300 font-medium">Objetivo:</p>
                                <p className="text-white font-semibold">{objetivo}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                
                {/* Métricas Físicas */}
                <div className="grid grid-cols-2 gap-3">
                    {peso && (
                        <MetricCard 
                            icon={<FaWeight />} 
                            label="Peso Actual" 
                            value={`${peso} kg`} 
                            accent="cyan" 
                        />
                    )}
                    {altura && (
                        <MetricCard 
                            icon={<FaRulerVertical />} 
                            label="Altura" 
                            value={`${altura} cm`} 
                            accent="green" 
                        />
                    )}
                </div>
                
                {/* IMC con Categoría */}
                {imc && (
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <FaHeartbeat className="text-orange-400 text-lg" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">IMC</p>
                                    <p className="text-lg font-semibold text-white">{imc}</p>
                                </div>
                            </div>
                            {imcCategoria && (
                                <span className={`text-sm font-medium ${imcCategoria.color}`}>
                                    {imcCategoria.text}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Experiencia y Grasa */}
                <div className="grid grid-cols-2 gap-3">
                    {experiencia && (
                        <MetricCard 
                            icon={<FaChartLine />} 
                            label="Experiencia" 
                            value={experiencia.charAt(0).toUpperCase() + experiencia.slice(1)} 
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
            </div>
        </div>
    );
};

export default ProfileInfo;
