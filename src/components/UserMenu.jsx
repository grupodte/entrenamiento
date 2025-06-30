import React from 'react';
import { FaUserEdit, FaSignOutAlt } from 'react-icons/fa';

const UserMenu = ({ onLogout, onEditProfile, onClose }) => {
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose} // Cierra el menú si se hace clic fuera
        >
            <div
                className="absolute right-4 top-16 mt-2 w-56 bg-white rounded-md shadow-xl z-50 text-gray-800 animate-fade-in-down"
                onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del menú lo cierre
            >
                <div className="py-1">
                    <button
                        onClick={() => {
                            onEditProfile();
                            onClose();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        <FaUserEdit className="mr-3" />
                        Editar Perfil
                    </button>
                    <button
                        onClick={() => {
                            onLogout();
                            onClose();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                        <FaSignOutAlt className="mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserMenu;
