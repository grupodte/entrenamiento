import AnimatedLayout from './animations/AnimatedLayout';

/**
 * PageTransition - Wrapper para transiciones de página
 * Ahora usa el sistema unificado de animaciones
 */
const PageTransition = ({ children }) => {
  return (
    <AnimatedLayout>
      {children}
    </AnimatedLayout>
  );
};

export default PageTransition;
