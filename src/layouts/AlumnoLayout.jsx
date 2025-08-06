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
  const handleOpenEditPerfil = useCallback(() => {
    setIsPerfilDrawerOpen(false);
    setIsEditPerfilDrawerOpen(true);
  }, []);
  const handleCloseEditPerfil = useCallback(() => setIsEditPerfilDrawerOpen(false), []);
  const handleBackToProfile = useCallback(() => {
    setIsEditPerfilDrawerOpen(false);
    setIsPerfilDrawerOpen(true);
  }, []);
  const handleProfileUpdate = useCallback(() => setIsEditPerfilDrawerOpen(false), []);

  return (
    <div className="fullscreen flex flex-col bg-gray-900 text-white relative p-6">
      <main className="flex-1 relative overflow-y-auto scrollbar-hide">
        <Outlet />
      </main>

      {/* Navbar flotante */}
      <FloatingNavBar onOpenPerfil={handleOpenPerfil} />

      {/* Drawers */}
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
