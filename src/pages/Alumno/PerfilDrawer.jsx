import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Drawer from '../../components/Drawer';
import { usePerfilData } from '../../hooks/usePerfilData';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { Edit2, LogOut, Clock } from 'lucide-react';
import MiniCalendar from '../../components/Perfil/MiniCalendar';
import WeightTracker from '../../components/Perfil/WeightTracker';

// Importa tus imágenes locales
import cursoImage from '../../assets/perfilbg.webp';
import rutinaImage from '../../assets/perfilbg2.webp';
import edit from '../../assets/edit.svg';

const fmt = (n, fallback = '–') => (Number.isFinite(n) ? n : fallback);

const StatCard = ({
    background,
    leftValue,
    leftSufix,
    label,
    icon = <Clock className="w-6 h-6" />,
    gradient = 'from-red-500/80 to-red-700/50',
}) => (
    <div className="relative w-full rounded-[10px] overflow-hidden">
        {/* BG image */}
        <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${background})` }}
        />
    
        {/* Foreground */}
        <div className="relative z-10 flex items-center h-[99px] px-4 pl-12 pr-8">
            {/* Left value - ajustar tamaño según contenido */}
            <div className="flex items-baseline min-w-[88px]">
                <span className={`text-white font-bold leading-none ${
                    typeof leftValue === 'string' && leftValue.includes('de') 
                        ? 'text-[24px]' // Texto más pequeño para formato "X de Y"
                        : 'text-[47px]' // Tamaño normal para números
                }`}>
                    {leftValue}
                </span>
                {leftSufix && (
                    <span className="ml-1 text-white/90 text-sm font-semibold">{leftSufix}</span>
                )}
            </div>

        

            {/* Right label */}
            <div className="flex-1 pl-[70px] text-left  leading-none">
                <p className="text-white/90 text-[13px] ">{label?.line1}</p>
                {label?.line2 && (
                    <p className="text-white/85 text-[13px]">{label.line2}</p>
                )}
            </div>
        </div>
    </div>
);

const PerfilDrawer = ({ isOpen, onClose, onEdit }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { perfil } = usePerfilData(user?.id, isOpen);
    const { timeData, trainingDays, monthlySessionsCount, weeklyAssignments, currentMonthTrainingDays } = useWorkoutData(user?.id, isOpen);

    const avatarUrl =
        perfil?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        'https://i.pravatar.cc/200?img=12';

    const displayName = (() => {
        // Intentar construir nombre completo desde perfil
        if (perfil?.nombre || perfil?.apellido) {
            const nombre = perfil?.nombre || '';
            const apellido = perfil?.apellido || '';
            const nombreCompleto = `${nombre} ${apellido}`.trim();
            if (nombreCompleto) {
                return nombreCompleto;
            }
        }
        
        // Fallback a metadata del usuario o email
        return user?.user_metadata?.full_name ||
               user?.email?.split('@')[0] ||
               'Usuario';
    })();

    const alturaM = perfil?.altura_m ?? perfil?.altura ?? null;
    const pesoKg = perfil?.peso_kg ?? perfil?.peso ?? null;
    const edad = perfil?.edad ?? null;

    // Calcular promedio de minutos
    const avgMinutes = useMemo(() => {
        
        if (!timeData || !Array.isArray(timeData) || timeData.length === 0) {
            return null;
        }
        
        const vals = timeData
            .map((d) => {
                // Intentar diferentes campos
                const minute = typeof d === 'number' ? d : 
                              (d?.minutes || d?.minutos || d?.total_minutos);
                return Number(minute);
            })
            .filter(Number.isFinite);
            
        
        if (!vals.length) return null;
        const sum = vals.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / vals.length);
        
        return avg;
    }, [timeData]);

    // Cálculo de progreso mensual: completados de meta total
    const monthlyProgress = useMemo(() => {

        
        // Completados: usar el conteo directo de sesiones mensuales
        const completados = typeof monthlySessionsCount === 'number' ? monthlySessionsCount : 0;
        
        // Meta: número total de asignaciones del usuario * 4 semanas
        const metaMensual = weeklyAssignments > 0 ? weeklyAssignments * 4 : 12; // Default 12 si no hay datos
        
        
        return {
            completados,
            meta: metaMensual,
            texto: `${completados} de ${metaMensual}`
        };
    }, [monthlySessionsCount, weeklyAssignments]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/auth');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            <div className="h-full flex flex-col font-product ">
                {/* Botón de editar */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                     
                        if (onEdit) {
                            onEdit();
                        } else {
                        }
                    }}
                    onTouchStart={(e) => {
                        e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                        e.stopPropagation();
                    }}
                    className="edit-button absolute right-4 top-4 z-[9999] p-4 rounded-lg "
                    aria-label="Editar perfil"
                    style={{
                        touchAction: 'manipulation',
                        userSelect: 'none'
                    }}
                >
                    <img 
                        src={edit} 
                        alt="edit" 
                        className="w-5 h-5 pointer-events-none" 
                        draggable="false"
                    />                    
                </button>
                
                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
                    {/* Perfil */}
                    <div className="relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-12 px-4 h-[200px]">
                            <img
                                src={avatarUrl}
                                alt="avatar"
                                className="w-[113px] h-[113px] rounded-full object-cover"
                            />
                            <div className="flex-1 flex flex-col justify-between h-[100px]">
                                <h2 className="text-[#151515] text-[27px] font-semibold leading-none">
                                    {displayName}
                                </h2>
                                <div className="mt-2 flex items-center gap-3 text-[13px] text-[#747474]">
                                    <span>{fmt(alturaM)}m</span>
                                    <span>{fmt(pesoKg)}kg</span>
                                    <span>{fmt(edad)} años</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resultados con imágenes locales */}
                    <div className="px-2 space-y-3">
                        <StatCard
                            background={rutinaImage}
                            leftValue={fmt(avgMinutes ?? 0)}
                            leftSufix="min"
                            label={{ line1: 'Tiempo promedio de', line2: 'entrenamiento' }}
                            gradient="from-red-600/80 to-red-500/40"
                        />
                        <StatCard
                            background={cursoImage}
                            leftValue={monthlyProgress.texto}
                            leftSufix=""
                            label={{
                                line1: 'Entrenamientos del mes',
                                line2: `Meta: ${monthlyProgress.meta} sesiones`,
                            }}
                            gradient="from-blue-600/80 to-fuchsia-500/40"
                        />

                        {/* Control de Peso */}
                        <WeightTracker userId={user?.id} />

                        {/* Mini Calendario */}
                        <MiniCalendar
                            trainingDays={currentMonthTrainingDays}
                            className=""
                        />
                    </div>
                    
               

                    {/* Logout */}
                    <div className="px-4 pt-6">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-black"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                        </button>
                    </div>
                    
                    {/* Espaciado final */}
                    <div className="h-6" />
                </div>
            </div>
        </Drawer>
    );
};

export default PerfilDrawer;
