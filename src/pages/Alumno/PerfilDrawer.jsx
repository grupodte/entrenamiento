import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import ProfileInfo from '../../components/Perfil/ProfileInfo';
import WorkoutStats from '../../components/Perfil/WorkoutStats';
import Drawer from '../../components/Drawer';
import PerfilDrawerSkeleton from '../../components/PerfilDrawerSkeleton';
import { useNavigate } from 'react-router-dom';
import { usePerfilData } from "../../hooks/usePerfilData";
import { useWorkoutData } from "../../hooks/useWorkoutData";

const PerfilDrawer = ({ isOpen, onClose, onEdit }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Hooks personalizados para manejo de datos
    const { perfil, loading, error } = usePerfilData(user?.id, isOpen);
    const { weightData, repsData, timeData, loadingCharts } = useWorkoutData(user?.id, isOpen);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/auth');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            {loading ? (
                <PerfilDrawerSkeleton />
            ) : error ? (
                <div className="bg-gray-800 text-white p-4">
                    <h1 className="text-xl font-bold mb-2">Error</h1>
                    <p className="text-sm text-gray-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            ) : (
                <div className="rounded-t-2xl shadow-lg p-4 min-h-[150px]">
                    <ProfileInfo
                        user={user}
                        perfil={perfil}
                        onEdit={onEdit}
                        onLogout={handleLogout}
                    />
                    <WorkoutStats
                        weightData={weightData}
                        repsData={repsData}
                        timeData={timeData}
                        loadingCharts={loadingCharts}
                    />
                </div>
            )}
        </Drawer>
    );
};

export default PerfilDrawer;
