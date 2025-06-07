import React from 'react';

const AdminBottomNav = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t shadow-md flex justify-around items-center md:hidden z-50">
            <button
                onClick={() => setActiveTab('alumnos')}
                className={`flex flex-col items-center py-2 px-4 text-sm ${activeTab === 'alumnos' ? 'text-blue-600 font-semibold' : 'text-gray-500'
                    }`}
            >
                👥
                <span>Alumnos</span>
            </button>
            <button
                onClick={() => setActiveTab('rutinas')}
                className={`flex flex-col items-center py-2 px-4 text-sm ${activeTab === 'rutinas' ? 'text-blue-600 font-semibold' : 'text-gray-500'
                    }`}
            >
                📋
                <span>Rutinas</span>
            </button>
        </nav>
    );
};

export default AdminBottomNav;
