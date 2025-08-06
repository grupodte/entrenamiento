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
    // Cambiamos weightData -> weightDailyData
    const { weightDailyData, repsData, timeData, trainingDays, loadingCharts } = useWorkoutData(user?.id, isOpen);


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

            <div className="rounded-t-2xl shadow-lg p-4 min-h-[150px]">
                <ProfileInfo
                    user={user}
                    perfil={perfil}
                    onEdit={onEdit}
                    onLogout={handleLogout}
                />
                <WorkoutStats
                    weightData={weightDailyData}
                    repsData={repsData}
                    timeData={timeData}
                    trainingDays={trainingDays}   // <--- ahora lo pasamos
                    loadingCharts={loadingCharts}
                />
            </div>

        </Drawer>
    );
};

export default PerfilDrawer;