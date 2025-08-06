import React from 'react';
import { FaEdit, FaUserCircle, FaPhone, FaBirthdayCake, FaTransgender, FaMapMarkerAlt, FaSignOutAlt } from 'react-icons/fa';

const InfoRow = ({ icon, label, value }) => value ? (
    <div className="flex items-center text-gray-300">
        {icon && <span className="mr-2 text-cyan-400 text-base">{icon}</span>}
        <div>
            <p className="text-[10px] font-semibold text-gray-400">{label}</p>
            <p className="text-sm text-white truncate">{value}</p>
        </div>
    </div>
) : null;

const ProfileInfo = ({ user, perfil, onEdit, onLogout }) => {
    const avatarUrl = perfil?.avatar_url;
    const nombre = perfil?.nombre || '';
    const apellido = perfil?.apellido || '';
    const edad = perfil?.edad;
    const genero = perfil?.genero;
    const telefono = perfil?.telefono;
    const ciudad = perfil?.ciudad;
    const pais = perfil?.pais;

    return (
        <div className="flex flex-col items-center mb-3 space-y-3">
            <div className="flex items-center w-full justify-between">
                <div className="flex items-center space-x-3">
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-cyan-500" /> : <FaUserCircle className="text-4xl text-blue-400" />}
                    <div>
                        <h2 className="text-sm font-semibold text-white">{nombre} {apellido}</h2>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onEdit} className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-700"><FaEdit className="text-white text-sm" /></button>
                    <button onClick={onLogout} className="p-2 rounded-full bg-red-600 hover:bg-red-700"><FaSignOutAlt className="text-white text-sm" /></button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs w-full">
                <InfoRow icon={<FaBirthdayCake />} label="Edad" value={edad ? `${edad} años` : null} />
                <InfoRow icon={<FaTransgender />} label="Género" value={genero} />
                <InfoRow icon={<FaPhone />} label="Teléfono" value={telefono} />
                <InfoRow icon={<FaMapMarkerAlt />} label="Ubicación" value={ciudad && pais ? `${ciudad}, ${pais}` : ciudad || pais} />
            </div>
        </div>
    );
};

export default ProfileInfo;
