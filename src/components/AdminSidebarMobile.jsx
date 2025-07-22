import { useNavigate, useLocation } from 'react-router-dom';
import { VscHome, VscArchive, VscAccount, VscSettingsGear } from 'react-icons/vsc';
import Dock from './Dock'; // Asegurate de tener el Dock importado correctamente

const AdminSidebarMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      icon: <VscHome size={22} />,
      label: 'Inicio',
      onClick: () => navigate('/admin'),
    },
    {
      icon: <VscArchive size={22} />,
      label: 'Rutinas',
      onClick: () => navigate('/admin/rutinas'),
    },
    {
      icon: <VscAccount size={22} />,
      label: 'Alumnos',
      onClick: () => navigate('/admin/alumnos'),
    },
    {
      icon: <VscSettingsGear size={22} />,
      label: 'Perfil',
      onClick: () => navigate('/admin/perfil'),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <Dock
        items={items}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
      />
    </div>
  );
};

export default AdminSidebarMobile;
