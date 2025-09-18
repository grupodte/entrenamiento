import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import ProfileInfo from '../../components/Perfil/ProfileInfo';
import WorkoutStats from '../../components/Perfil/WorkoutStats';
import Drawer from '../../components/Drawer';
import { useNavigate } from 'react-router-dom';
import { usePerfilData } from "../../hooks/usePerfilData";
import { useWorkoutData } from "../../hooks/useWorkoutData";
import { motion, AnimatePresence } from 'framer-motion';
import { FaSignOutAlt, FaCog } from 'react-icons/fa';

const tabs = [{ label: 'Perfil' }, { label: 'Resultados' }];

const PerfilDrawer = ({ isOpen, onClose, onEdit }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(tabs[0].label);

    const { perfil, loading, error } = usePerfilData(user?.id, isOpen);
    const { weightDailyData, repsData, timeData, trainingDays, loadingCharts } = useWorkoutData(user?.id, isOpen);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/auth');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };
    
    const [direction, setDirection] = useState(0);

    const paginate = (newDirection) => {
        const newIndex = tabs.findIndex(t => t.label === activeTab) + newDirection;
        if (newIndex >= 0 && newIndex < tabs.length) {
            setDirection(newDirection);
            setActiveTab(tabs[newIndex].label);
        }
    };


    return (
        <Drawer isOpen={isOpen} onClose={onClose} height="h-[95vh]">
            <div className="flex flex-col h-full">
                {/* Navegación de pestañas */}
                <div className="flex-shrink-0 px-4 pt-2">
                    <div className="flex justify-center border-b border-gray-200/20 pb-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.label}
                                onClick={() => {
                                    const newIndex = tabs.findIndex(t => t.label === tab.label);
                                    const currentIndex = tabs.findIndex(t => t.label === activeTab);
                                    setDirection(newIndex > currentIndex ? 1 : -1);
                                    setActiveTab(tab.label);
                                }}
                                className={`relative py-3 px-6 text-sm font-medium transition-colors duration-300
                                    ${activeTab === tab.label ? 'text-white' : 'text-gray-400 hover:text-white'}`
                                }
                            >
                                {tab.label}
                                {activeTab === tab.label && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"
                                        layoutId="underline"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="flex-1 overflow-hidden">
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={activeTab}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="h-full overflow-y-auto scrollbar-hide px-4 pb-4"
                        >
                            {activeTab === 'Perfil' && (
                                <div className="space-y-6">
                                    <ProfileInfo
                                        user={user}
                                        perfil={perfil}
                                        onEdit={onEdit}
                                    />
                                    
                                    {/* Botón de cerrar sesión discreto al final del perfil */}
                                    <div className="pt-6">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors duration-200 group"
                                        >
                                            <FaSignOutAlt className="text-xs group-hover:text-red-400" />
                                            <span className="group-hover:text-red-400">Cerrar Sesión</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'Resultados' && (
                                <WorkoutStats
                                    weightData={weightDailyData}
                                    repsData={repsData}
                                    timeData={timeData}
                                    trainingDays={trainingDays}
                                    loadingCharts={loadingCharts}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </Drawer>
    );
};

export default PerfilDrawer;