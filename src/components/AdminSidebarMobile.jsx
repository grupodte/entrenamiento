import { Link, useLocation } from "react-router-dom";
import { FaUsers, FaClipboardList, FaDumbbell, FaBook, FaHeart } from "react-icons/fa";
import { Users } from 'lucide-react';
import { motion } from "framer-motion";

const NAV = [
  { path: "/admin/alumnos", title: "Alumnos", icon: <FaUsers /> },
  { path: "/admin/grupos", title: "Grupos", icon: <Users /> },
  { path: "/admin/rutinas", title: "Rutinas", icon: <FaClipboardList /> },
  { path: "/admin/ejercicios", title: "Ejercicios", icon: <FaDumbbell /> },
  { path: "/admin/cursos", title: "Cursos", icon: <FaBook /> },
  { path: "/admin/dietas", title: "Dietas", icon: <FaHeart /> },
];

export default function AdminSidebarMobile() {
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-3 left-1/2 -translate-x-1/2 z-50
        h-[66px] w-[92%] max-w-xl
        rounded-3xl px-3
        bg-white/80 dark:bg-black/70 backdrop-blur-xl
        border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.35)]
        md:hidden
      "
      role="navigation"
      aria-label="Menú inferior de administración"
    >
      <ul className="flex h-full items-center justify-around">
        {NAV.map(({ path, title, icon }) => {
          const active =
            (location.pathname.startsWith(path) && path !== "/admin") ||
            location.pathname === path;
          return (
            <li key={path} className="relative flex-1">
              <Link
                to={path}
                aria-label={title}
                className="group grid place-items-center gap-1 py-2"
              >
                {/* Pill activo animado */}
                {active && (
                  <motion.span
                    layoutId="mobile-active"
                    className="
                      absolute inset-y-1 left-1 right-1 rounded-2xl
                      bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500
                      opacity-90
                      shadow-[0_0_18px_rgba(34,211,238,0.45)]
                    "
                    transition={{ type: "spring", stiffness: 350, damping: 24 }}
                  />
                )}

                <span className={`relative z-10 text-[20px] ${active ? "text-white" : "text-gray-800 dark:text-gray-200 group-active:scale-95 transition-transform"}`}>
                  {icon}
                </span>
                <span className={`relative z-10 text-[11px] font-medium ${active ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>
                  {title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
