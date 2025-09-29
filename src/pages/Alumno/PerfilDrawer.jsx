import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import Drawer from '../../components/Drawer';
import { usePerfilData } from '../../hooks/usePerfilData';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { Edit2, LogOut, Clock } from 'lucide-react';

// Importa tus imágenes locales
import cursoImage from '../../assets/perfilbg.webp';
import rutinaImage from '../../assets/rutina.png';
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
            {/* Left number */}
            <div className="flex items-baseline min-w-[88px]">
                <span className="text-white font-bold text-[47px] leading-none ">
                    {leftValue}
                </span>
                {leftSufix && (
                    <span className="ml-1 text-white/90 text-sm font-semibold">{leftSufix}</span>
                )}
            </div>

        

            {/* Right label */}
            <div className="flex-1 text-right leading-snug">
                <p className="text-white/90 text-[13px] ">{label?.line1}</p>
                {label?.line2 && (
                    <p className="text-white/85 text-[11px]">{label.line2}</p>
                )}
            </div>
        </div>
    </div>
);

const PerfilDrawer = ({ isOpen, onClose, onEdit }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { perfil } = usePerfilData(user?.id, isOpen);
    const { timeData, trainingDays } = useWorkoutData(user?.id, isOpen);

    const avatarUrl =
        perfil?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        'https://i.pravatar.cc/200?img=12';

    const displayName =
        perfil?.nombre ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'Usuario';

    const alturaM = perfil?.altura_m ?? perfil?.altura ?? null;
    const pesoKg = perfil?.peso_kg ?? perfil?.peso ?? null;
    const edad = perfil?.edad ?? null;

    // Calcular promedio de minutos
    const avgMinutes = useMemo(() => {
        if (!timeData || !Array.isArray(timeData) || timeData.length === 0) return null;
        const vals = timeData
            .map((d) => (typeof d === 'number' ? d : Number(d?.minutes)))
            .filter(Number.isFinite);
        if (!vals.length) return null;
        const sum = vals.reduce((a, b) => a + b, 0);
        return Math.round(sum / vals.length);
    }, [timeData]);

    // Entrenos del mes
    const trainingsThisMonth = useMemo(() => {
        if (!trainingDays || !Array.isArray(trainingDays)) return null;
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const norm = (v) => {
            if (!v) return null;
            const d =
                typeof v === 'string' || typeof v === 'number'
                    ? new Date(v)
                    : new Date(v?.date ?? v);
            return isNaN(d) ? null : d;
        };
        return trainingDays
            .map(norm)
            .filter(Boolean)
            .filter((d) => d.getFullYear() === y && d.getMonth() === m).length;
    }, [trainingDays]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/auth');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} height="h-[100vh]">
            <div className="h-full overflow-y-auto scrollbar-hide font-product">
                <button
                    onClick={onEdit}
                    className="absolute right-6 top-2"
                    aria-label="Editar perfil"
                    
                >
                      <img src={edit} alt="edit" className="w-7 h-7" />                    
                </button>
                {/* Perfil */}
                <div className="relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-8 p-4">
                        <img
                            src={avatarUrl}
                            alt="avatar"
                            className="w-[113px] h-[113px] rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <h2 className="text-[#151515] text-[27px] font-extrabold leading-5 drop-shadow">
                                {displayName} 
                            </h2>
                            <div className="mt-2 flex items-center gap-3 text-[12px] text-[#151515]">
                                <span>{fmt(alturaM)}m</span>
                                <span>{fmt(pesoKg)}kg</span>
                                <span>{fmt(edad)} años</span>
                            </div>
                        </div>
                 
                    </div>
                </div>

                {/* Resultados con imágenes locales */}
                <div className="grid grid-cols-1 gap-3">
                    <StatCard
                        background={rutinaImage}
                        leftValue={fmt(avgMinutes ?? 0)}
                        leftSufix="min"
                        label={{ line1: 'Tiempo promedio de', line2: 'entrenamiento' }}
                        gradient="from-red-600/80 to-red-500/40"
                    />
                    <StatCard
                        background={cursoImage}
                        leftValue={fmt(trainingsThisMonth ?? 0)}
                        label={{
                            line1: 'Número de entrenamientos',
                            line2: 'realizados en el mes',
                        }}
                        gradient="from-blue-600/80 to-fuchsia-500/40"
                    />
                </div>

                {/* Logout */}
                <div className="pt-6 ">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-black"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>

                <div className="h-6" />
            </div>
        </Drawer>
    );
};

export default PerfilDrawer;
