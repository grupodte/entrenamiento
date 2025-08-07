// /layouts/AppLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
    return (
        <div className="main-content scroll-smooth-hidden"
>
       
                <Outlet />
        </div>
    );
};

export default AppLayout;
