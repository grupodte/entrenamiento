import React from 'react';
import {
    FaEdit, FaUserCircle, FaBullseye, FaWeight,
    FaRulerVertical, FaPercentage, FaHeartbeat, FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext'; // Importamos el contexto

const KPIBox = ({ icon, label, value, sublabel }) => (
    <div className="flex flex-col items-center justify-center rounded-lg p-2 flex-1">
        <span className="text-cyan-400 text-base">{icon}</span>
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-white">{value || '-'}</p>
        {sublabel && <p className="text-[9px] text-gray-500">{sublabel}</p>}
    </div>
);

const ProfileInfo = ({ user, perfil, onEdit }) => {
    const { logout } = useAuth(); // Obtenemos el método de logout

    const avatarUrl = perfil?.avatar_url;
    const nombre = perfil?.nombre || '';
    const objetivo = perfil?.objetivo || "Definí tu objetivo";

    const peso = perfil?.peso ? `${perfil.peso} kg` : '-';
    const altura = perfil?.altura ? `${perfil.altura} cm` : '-';
    const imc = perfil?.imc ? perfil.imc.toFixed(1) : '-';
    const grasa = perfil?.porcentaje_grasa ? `${perfil.porcentaje_grasa.toFixed(1)}%` : '-';
    const metaPeso = perfil?.meta_peso ? `${perfil.meta_peso} kg` : null;
    const metaGrasa = perfil?.meta_grasa ? `${perfil.meta_grasa}%` : null;
    const actividad = perfil?.actividad_fisica || perfil?.frecuencia_entrenamiento || null;

    return (
        <div className="flex flex-col space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border border-cyan-500" />
                    ) : (
                        <FaUserCircle className="text-4xl text-blue-400" />
                    )}
                    <div>
                        <h2 className="text-sm font-semibold text-white">Hola, {nombre}</h2>
                        <div className="flex items-center text-xs text-cyan-400 space-x-1">
                            <FaBullseye className="text-xs" />
                            <span>{objetivo}</span>
                        </div>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-full bg-cyan-600 hover:bg-cyan-700"
                        title="Editar perfil"
                    >
                        <FaEdit className="text-white text-sm" />
                    </button>
                    <button
                        onClick={logout}
                        className="p-1.5 rounded-full bg-red-600 hover:bg-red-700"
                        title="Cerrar sesión"
                    >
                        <FaSignOutAlt className="text-white text-sm" />
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-2">
                <KPIBox icon={<FaWeight className="text-white text-sm" />} label="Peso" value={peso} />
                <KPIBox icon={<FaRulerVertical className="text-white text-sm" />} label="Altura" value={altura} />
                <KPIBox icon={<FaHeartbeat className="text-white text-sm" />} label="IMC" value={imc} />
                <KPIBox icon={<FaPercentage className="text-white text-sm" />} label="Grasa" value={grasa} />
            </div>

            {/* Datos complementarios */}
            {(metaPeso || metaGrasa || actividad) && (
                <div className="text-[10px] text-gray-400 space-y-1">
                    {metaPeso && <p>Meta de peso: <span className="text-white">{metaPeso}</span></p>}
                    {metaGrasa && <p>Meta de grasa: <span className="text-white">{metaGrasa}</span></p>}
                    {actividad && <p>Actividad: <span className="text-white">{actividad}</span></p>}
                </div>
            )}
        </div>
    );
};

export default ProfileInfo;
