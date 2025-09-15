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
            <div className="rounded-t-2xl shadow-lg p-4 min-h-[150px] flex flex-col">
                <div className="flex justify-center border-b border-gray-200/20 mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.label}
                            onClick={() => {
                                const newIndex = tabs.findIndex(t => t.label === tab.label);
                                const currentIndex = tabs.findIndex(t => t.label === activeTab);
                                setDirection(newIndex > currentIndex ? 1 : -1);
                                setActiveTab(tab.label);
                            }}
                            className={`relative py-2 px-4 text-sm font-medium transition-colors duration-300
                                ${activeTab === tab.label ? 'text-white' : 'text-gray-400 hover:text-white'}`
                            }
                        >
                            {tab.label}
                            {activeTab === tab.label && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                                    layoutId="underline"
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

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
                        className="flex-grow"
                    >
                        {activeTab === 'Perfil' && (
                            <ProfileInfo
                                user={user}
                                perfil={perfil}
                                onEdit={onEdit}
                                onLogout={handleLogout}
                            />
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
        </Drawer>
    );
};

export default PerfilDrawer;