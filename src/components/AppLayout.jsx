// src/components/AppLayout.jsx

import React from 'react';
import PullToRefresh from 'react-pull-to-refresh';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
    /**
     * Esta función se ejecutará cuando el usuario "sinche" hacia abajo.
     * Para un refresh global, la acción más simple es recargar la página.
     */
    const handleRefresh = () => {
        window.location.reload();
        // Devolvemos una Promise para que el indicador de carga se oculte.
        return Promise.resolve();
    };

    return (
        // Se eliminó la lógica de 'disabled' y el hook 'useNavigation'
        <PullToRefresh onRefresh={handleRefresh}>
            {/* Outlet renderizará la página actual (Dashboard, AlumnoPerfil, etc.) */}
            <Outlet />
        </PullToRefresh>
    );
};

export default AppLayout;