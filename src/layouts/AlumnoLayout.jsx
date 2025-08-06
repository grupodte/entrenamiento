import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import FloatingNavBar from '../components/FloatingNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';

const AlumnoLayout = () => {
  const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
  const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

  const handleOpenPerfil = useCallback(() => setIsPerfilDrawerOpen(true), []);
  const handleClosePerfil = useCallback(() => setIsPerfilDrawerOpen(false), []);
  const handleOpenEditPerfil = useCallback(() => { setIsPerfilDrawerOpen(false); setIsEditPerfilDrawerOpen(true); }, []);
  const handleCloseEditPerfil = useCallback(() => setIsEditPerfilDrawerOpen(false), []);
  const handleBackToProfile = useCallback(() => { setIsEditPerfilDrawerOpen(false); setIsPerfilDrawerOpen(true); }, []);
  const handleProfileUpdate = useCallback(() => setIsEditPerfilDrawerOpen(false), []);

  return (
    <div className="w-full h-[100dvh] bg-[#121212] text-white flex flex-col relative">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <FloatingNavBar onOpenPerfil={handleOpenPerfil} />

      <PerfilDrawer
        isOpen={isPerfilDrawerOpen}
        onClose={handleClosePerfil}
        onEdit={handleOpenEditPerfil}
      />

      <EditarPerfilDrawer
        isOpen={isEditPerfilDrawerOpen}
        onClose={handleCloseEditPerfil}
        onBack={handleBackToProfile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default AlumnoLayout;
