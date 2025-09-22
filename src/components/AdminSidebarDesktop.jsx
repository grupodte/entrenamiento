import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaUsers,
    FaClipboardList,
    FaDumbbell,
    FaChevronLeft,
    FaChevronDown,
    FaSignOutAlt,
    FaBook,
    FaHeart,
} from "react-icons/fa";
import { Users } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../hooks/useSidebar";

// 🎨 Gradiente de marca
const BRAND_GRADIENT = "from-orange-500 via-pink-500 to-red-600";

// 🧭 Navegación (Sesiones con hijos)
const NAV = [
    { path: "/admin/alumnos", label: "Alumnos", icon: <FaUsers /> },
    { path: "/admin/grupos", label: "Grupos", icon: <Users /> },
    {
        path: "/admin/rutinas",
        label: "Rutinas",
        icon: <FaClipboardList />,
        children: [
            { path: "/admin/rutinas", label: "Listado sesion" },
            { path: "/admin/rutinas/crear", label: "Crear sesion" },
            { path: "/admin/rutinas/rutina", label: "Crear rutina" },
            { path: "/admin/rutinas-reales", label: "Listado Rutinas" },
        ],
    },
    { path: "/admin/ejercicios", label: "Ejercicios", icon: <FaDumbbell /> },
    { path: "/admin/cursos", label: "Cursos", icon: <FaBook /> },
    { path: "/admin/dietas", label: "Dietas", icon: <FaHeart /> },
];

export default function AdminSidebarDesktop() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Usar el hook personalizado para manejar el estado del sidebar
    const {
        isCollapsed,
        toggleCollapse,
        expandedMenus,
        toggleMenu,
        isMenuExpanded,
        closeAllMenus
    } = useSidebar();

    // Calcular el ancho del sidebar
    const sidebarWidth = isCollapsed ? "80px" : "280px";

    // Logout handler
    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (e) {
            console.error("Error durante el logout:", e);
        }
    };

    // Handle navigation to close menus when clicking on a non-menu item
    const handleSimpleNavigation = () => {
        closeAllMenus();
    };

    // Función para determinar si una ruta está activa
    const isRouteActive = (itemPath, children = null) => {
        const currentPath = location.pathname;

        if (children) {
            // Para ítems con hijos, verificar si alguna ruta hija está activa
            return children.some(child => currentPath === child.path);
        } else {
            // Para ítems simples, comparación exacta
            return currentPath === itemPath;
        }
    };

    // Función para manejar click en ítem con submenú
    const handleMenuItemClick = (item) => {
        if (isCollapsed) {
            // Si está colapsado, navegar directamente a la ruta principal
            navigate(item.path);
        } else {
            // Si está expandido, alternar el menú o navegar
            if (isMenuExpanded(item.path)) {
                // Si ya está expandido, navegar a la ruta principal
                navigate(item.path);
            } else {
                // Si no está expandido, expandir y navegar
                toggleMenu(item.path);
                navigate(item.path);
            }
        }
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: sidebarWidth }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="
                hidden md:flex h-screen sticky top-0 z-40
                flex-col gap-4 border-r border-white/10
                bg-white/70 dark:bg-black/40 backdrop-blur-xl
                shadow-[0_8px_24px_rgba(0,0,0,0.25)]
                px-3 py-4 relative 
            "
        >
            {/* Glow decorativo */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div
                    className={`absolute -top-24 -right-24 h-60 w-60 blur-3xl opacity-30 bg-gradient-to-br ${BRAND_GRADIENT} rounded-full`}
                />
                <div
                    className={`absolute bottom-0 left-1/3 h-48 w-48 blur-3xl opacity-20 bg-gradient-to-tr ${BRAND_GRADIENT} rounded-full`}
                />
            </div>

            {/* Header / Brand */}
            <div className="flex items-center gap-3 mt-4 px-3">
                <div
                    className={`
                        shrink-0 grid place-items-center rounded-2xl p-[10px]
                        bg-gradient-to-br ${BRAND_GRADIENT}
                        shadow-[0_0_20px_rgba(251,146,60,0.35)]
                        text-white text-xl
                    `}
                >
                    <span className="font-black select-none">F</span>
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col leading-tight">
                        <span className="text-gray-900 dark:text-white font-semibold">FitApp Panel</span>
                        <span className="text-xs text-gray-600 dark:text-white/70 -mt-0.5">Admin</span>
                    </div>
                )}
                <button
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Expandir" : "Colapsar"}
                    className="
                        ml-auto shrink-0 rounded-xl p-2
                        bg-white/80 dark:bg-white/10 border border-white/10
                        hover:bg-white dark:hover:bg-white/20
                        transition-all text-black dark:text-white
                    "
                >
                    <motion.span
                        initial={false}
                        animate={{ rotate: isCollapsed ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="grid place-items-center"
                    >
                        <FaChevronLeft />
                    </motion.span>
                </button>
            </div>

            {/* NAV */}
            <nav className="flex flex-col gap-1 mt-6">
                {NAV.map((item) => {
                    // Ítem simple (sin hijos)
                    if (!item.children) {
                        const isActive = isRouteActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleSimpleNavigation}
                                className={`
                                    group relative flex items-center gap-3 rounded-2xl px-3 py-2.5
                                    transition-all duration-200
                                    ${isActive ? "text-white" : "text-gray-800 dark:text-gray-200 hover:text-white"}
                                `}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="active-pill"
                                        className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${BRAND_GRADIENT} shadow-[0_0_24px_rgba(251,146,60,0.4)]`}
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <span
                                    className={`relative z-10 text-[18px] ${isActive ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" : ""}`}
                                >
                                    {item.icon}
                                </span>
                                {!isCollapsed && (
                                    <span className="relative z-10 font-medium">{item.label}</span>
                                )}

                                {/* Tooltip en colapsado */}
                                {isCollapsed && (
                                    <span className="
                                        absolute left-full ml-2 whitespace-nowrap rounded-lg px-2 py-1 text-xs
                                        bg-black text-white/90 border border-white/10
                                        opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0
                                        pointer-events-none transition-all
                                    ">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    }

                    // Ítem con submenú (Sesiones)
                    const isExpanded = isMenuExpanded(item.path);
                    const isActive = isRouteActive(item.path, item.children);

                    return (
                        <div key={item.path} className="relative group">
                            {/* Botón/Link padre */}
                            <button
                                type="button"
                                onClick={() => handleMenuItemClick(item)}
                                className={`
                                    w-full relative flex items-center gap-3 rounded-2xl px-3 py-2.5
                                    transition-all duration-200
                                    ${isActive
                                        ? "text-white"
                                        : "text-gray-800 dark:text-gray-200 hover:text-white"}
                                `}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="active-pill"
                                        className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${BRAND_GRADIENT} shadow-[0_0_24px_rgba(251,146,60,0.4)]`}
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}

                                <span
                                    className={`relative z-10 text-[18px] ${isActive ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]" : ""}`}
                                >
                                    {item.icon}
                                </span>
                                {!isCollapsed && (
                                    <>
                                        <span className="relative z-10 font-medium flex-1 text-left">
                                            {item.label}
                                        </span>
                                        <motion.span
                                            initial={false}
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="relative z-10 text-sm opacity-80"
                                        >
                                            <FaChevronDown />
                                        </motion.span>
                                    </>
                                )}
                            </button>

                            {/* SUBMENÚ (expandible cuando NO está colapsada) */}
                            {!isCollapsed && (
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.ul
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="pl-10 pr-2 mt-1 flex flex-col gap-1 overflow-hidden"
                                        >
                                            {item.children.map((child) => {
                                                const isChildActive = location.pathname === child.path;
                                                return (
                                                    <li key={child.path}>
                                                        <Link
                                                            to={child.path}
                                                            className={`
                                                                block rounded-xl px-3 py-2 text-sm transition-all
                                                                ${isChildActive
                                                                    ? "text-white bg-white/10 ring-1 ring-white/15"
                                                                    : "text-gray-700 dark:text-gray-300 hover:text-white hover:bg-white/5"
                                                                }
                                                            `}
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>
                            )}

                            {/* FLYOUT (cuando está colapsada, submenú al hover) */}
                            {isCollapsed && (
                                <div className="
                                    absolute top-0 left-full ml-3 w-52 z-50
                                    rounded-2xl p-2
                                    bg-white/95 dark:bg-black/95 backdrop-blur-xl
                                    border border-white/10 shadow-2xl
                                    opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto
                                    transition-opacity duration-200
                                ">
                                    {item.children.map((child) => {
                                        const isChildActive = location.pathname === child.path;
                                        return (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                className={`
                                                    block rounded-xl px-3 py-2 text-sm transition-all
                                                    ${isChildActive
                                                        ? "text-white bg-gradient-to-r from-orange-500/20 to-red-500/20 ring-1 ring-white/15"
                                                        : "text-gray-800 dark:text-gray-200 hover:text-white hover:bg-white/10"
                                                    }
                                                `}
                                            >
                                                {child.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Tooltip en colapsado para menú padre */}
                            {isCollapsed && (
                                <span className="
                                    absolute left-full ml-2 whitespace-nowrap rounded-lg px-2 py-1 text-xs
                                    bg-black text-white/90 border border-white/10
                                    opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0
                                    pointer-events-none transition-all z-40
                                ">
                                    {item.label}
                                </span>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="flex-1" />

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="
                    group relative overflow-hidden rounded-2xl px-3 py-2.5 mb-4
                    text-left flex items-center gap-3
                    text-gray-900 dark:text-gray-100
                    hover:text-white transition-all
                    border border-white/10
                    bg-white/70 dark:bg-white/5
                    hover:bg-gradient-to-r hover:from-red-500/80 hover:to-rose-500/80
                "
            >
                <span className="text-[18px]">
                    <FaSignOutAlt />
                </span>
                {!isCollapsed && "Cerrar sesión"}

                {/* Tooltip en colapsado para logout */}
                {isCollapsed && (
                    <span className="
                        absolute left-full ml-2 whitespace-nowrap rounded-lg px-2 py-1 text-xs
                        bg-black text-white/90 border border-white/10
                        opacity-0 -translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0
                        pointer-events-none transition-all
                    ">
                        Cerrar sesión
                    </span>
                )}
            </button>
        </motion.aside>
    );
}