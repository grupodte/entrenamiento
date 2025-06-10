// src/components/AppLayout.jsx

import React from 'react';
import PullToRefresh from 'react-pull-to-refresh';
import 'react-pull-to-refresh/dist/index.css'; // Importación de estilos
import { Outlet } from 'react-router-dom';
import './AppLayout.css'; // Crearemos este archivo de CSS

const AppLayout = () => {
    const handleRefresh = () => {
        window.location.reload();
        return Promise.resolve();
    };

    return (
        // Añadimos una clase 'pull-to-refresh-container' al div principal
        <div className="pull-to-refresh-container">
            <PullToRefresh onRefresh={handleRefresh}>
                <div className="content-wrapper">
                    <Outlet />
                </div>
            </PullToRefresh>
        </div>
    );
};

export default AppLayout;