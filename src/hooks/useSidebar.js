import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export function useSidebar() {
  const location = useLocation();
  
  // Estado del colapso del sidebar
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('fitapp.sidebar.collapsed');
    return saved === '1';
  });

  // Estado de los menús expandidos (puede haber múltiples)
  const [expandedMenus, setExpandedMenus] = useState(() => {
    const saved = localStorage.getItem('fitapp.sidebar.expanded');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistir estado del colapso
  useEffect(() => {
    localStorage.setItem('fitapp.sidebar.collapsed', isCollapsed ? '1' : '0');
  }, [isCollapsed]);

  // Persistir menús expandidos
  useEffect(() => {
    localStorage.setItem('fitapp.sidebar.expanded', JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  // Toggle colapso
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Toggle menú específico
  const toggleMenu = useCallback((menuPath) => {
    setExpandedMenus(prev => {
      const isExpanded = prev.includes(menuPath);
      if (isExpanded) {
        return prev.filter(path => path !== menuPath);
      } else {
        // Si quieres que solo un menú esté abierto a la vez, usa:
        // return [menuPath];
        // Si quieres permitir múltiples menús abiertos, usa:
        return [...prev, menuPath];
      }
    });
  }, []);

  // Verificar si un menú está expandido
  const isMenuExpanded = useCallback((menuPath) => {
    return expandedMenus.includes(menuPath);
  }, [expandedMenus]);

  // Cerrar todos los menús
  const closeAllMenus = useCallback(() => {
    setExpandedMenus([]);
  }, []);

  // Auto-expandir menú activo al cambiar de ruta
  useEffect(() => {
    // Encontrar si la ruta actual pertenece a algún menú con hijos
    const currentPath = location.pathname;
    // Esta lógica se puede ajustar según tu estructura de navegación
    if (currentPath.startsWith('/admin/rutinas')) {
      // Auto-expandir el menú de rutinas si no está expandido
      if (!expandedMenus.includes('/admin/rutinas')) {
        setExpandedMenus(prev => [...prev, '/admin/rutinas']);
      }
    }
  }, [location.pathname]);

  return {
    isCollapsed,
    toggleCollapse,
    expandedMenus,
    toggleMenu,
    isMenuExpanded,
    closeAllMenus,
  };
}
