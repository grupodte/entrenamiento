import React from 'react';
import { 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon,
  HomeIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Share, SquarePlus } from 'lucide-react';

const InstallInstructions = ({ platform, className = '' }) => {
  // Configuración de instrucciones para cada plataforma
  const instructionsConfig = {
    'ios': {
      title: 'Agregar a Pantalla de Inicio',
      subtitle: 'Proceso simplificado:',
      icon: DevicePhoneMobileIcon,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      steps: [
        {
          number: 1,
          text: 'Ir al botón de compartir',
          icon: Share,
          detail: 'Toca el ícono de compartir en Safari'
        },
        {
          number: 2,
          text: 'Agregar al inicio',
          icon: SquarePlus,
          detail: 'Selecciona "Agregar a pantalla de inicio"'
        },
        {
          number: 3,
          text: 'Confirmar',
          icon: HomeIcon,
          detail: 'Confirma y queda listo agregado al inicio'
        }
      ],
      tip: 'La aplicación funcionará sin conexión a internet y se comportará como una app nativa.',
      note: 'Asegúrese de estar usando Safari para que funcione correctamente.'
    },
    'android-chrome': {
      title: 'Instalar Aplicación',
      subtitle: 'Proceso simplificado:',
      icon: DevicePhoneMobileIcon,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
      steps: [
        {
          number: 1,
          text: 'Ir al botón de compartir',
          icon: Share,
          detail: 'Toca el menú (tres puntos) o el ícono de compartir'
        },
        {
          number: 2,
          text: 'Agregar al inicio',
          icon: SquarePlus,
          detail: 'Selecciona "Agregar a pantalla de inicio" o "Instalar app"'
        },
        {
          number: 3,
          text: 'Confirmar',
          icon: HomeIcon,
          detail: 'Confirma y queda listo agregado al inicio'
        }
      ],
      tip: 'También puede buscar el ícono de instalación en la barra de direcciones del navegador.',
      note: 'La aplicación se comportará exactamente como una app nativa de Android.'
    },
    'android-firefox': {
      title: 'Agregar a Pantalla de Inicio',
      subtitle: 'Proceso simplificado:',
      icon: DevicePhoneMobileIcon,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      steps: [
        {
          number: 1,
          text: 'Ir al botón de compartir',
          icon: Share,
          detail: 'Toca el menú (tres líneas) en Firefox'
        },
        {
          number: 2,
          text: 'Agregar al inicio',
          icon: SquarePlus,
          detail: 'Selecciona "Agregar a pantalla de inicio"'
        },
        {
          number: 3,
          text: 'Confirmar',
          icon: HomeIcon,
          detail: 'Confirma y queda listo agregado al inicio'
        }
      ],
      tip: 'El acceso directo abrirá la aplicación directamente en Firefox sin mostrar la interfaz del navegador.',
      note: 'Firefox creará un acceso directo optimizado para la aplicación.'
    },
    'windows-chrome': {
      title: 'Instalar Aplicación en Windows',
      subtitle: 'Sigue estos pasos en Chrome:',
      icon: ComputerDesktopIcon,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
      steps: [
        {
          number: 1,
          text: 'Busque el ícono de instalación en la barra de direcciones',
          icon: ArrowDownTrayIcon,
          detail: 'Aparece como un ícono de computadora con una flecha'
        },
        {
          number: 2,
          text: 'O vaya al menú (tres puntos) y seleccione "Instalar aplicación"',
          icon: EllipsisHorizontalIcon,
          detail: 'La opción aparece en el menú principal de Chrome'
        },
        {
          number: 3,
          text: 'Haga clic en "Instalar"',
          icon: PlusIcon,
          detail: 'Aparecerá una ventana de confirmación'
        },
        {
          number: 4,
          text: 'La aplicación se agregará a su escritorio',
          icon: HomeIcon,
          detail: 'También aparecerá en el menú inicio'
        }
      ],
      tip: 'La aplicación aparecerá en el menú inicio y se puede anclar a la barra de tareas.',
      note: 'Se comportará como una aplicación nativa de Windows con su propia ventana.'
    },
    'macos-chrome': {
      title: 'Instalar Aplicación en macOS',
      subtitle: 'Sigue estos pasos en Chrome:',
      icon: ComputerDesktopIcon,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-600/10',
      steps: [
        {
          number: 1,
          text: 'Busque el ícono de instalación en la barra de direcciones',
          icon: ArrowDownTrayIcon,
          detail: 'Aparece como un ícono de computadora con una flecha'
        },
        {
          number: 2,
          text: 'O vaya al menú Chrome y seleccione "Instalar aplicación"',
          icon: EllipsisHorizontalIcon,
          detail: 'La opción aparece en el menú principal'
        },
        {
          number: 3,
          text: 'Haga clic en "Instalar"',
          icon: PlusIcon,
          detail: 'Aparecerá una ventana de confirmación'
        },
        {
          number: 4,
          text: 'La aplicación aparecerá en Launchpad y en el Dock',
          icon: HomeIcon,
          detail: 'Podrá acceder desde Spotlight también'
        }
      ],
      tip: 'Podrá acceder desde Spotlight escribiendo el nombre de la aplicación.',
      note: 'La aplicación tendrá su propia ventana independiente del navegador.'
    },
    'default': {
      title: 'Instalar Aplicación',
      subtitle: 'Instrucciones generales:',
      icon: ArrowDownTrayIcon,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      steps: [
        {
          number: 1,
          text: 'Busque la opción "Instalar app" en su navegador',
          icon: ArrowDownTrayIcon,
          detail: 'Puede estar en la barra de direcciones o menú principal'
        },
        {
          number: 2,
          text: 'O busque "Agregar a pantalla de inicio"',
          icon: HomeIcon,
          detail: 'Esta opción varía según el navegador'
        },
        {
          number: 3,
          text: 'Siga las instrucciones que aparezcan',
          icon: EllipsisHorizontalIcon,
          detail: 'Cada navegador tiene su propio proceso'
        },
        {
          number: 4,
          text: 'Disfrute de la experiencia como app nativa',
          icon: HomeIcon,
          detail: 'La aplicación aparecerá en su dispositivo'
        }
      ],
      tip: 'Las opciones pueden variar según su navegador y dispositivo específico.',
      note: 'Si no encuentra la opción, intente actualizar su navegador.'
    }
  };

  const config = instructionsConfig[platform] || instructionsConfig['default'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-2xl mx-auto ${className}`}
    >
      {/* Header */}
      <div className={`p-6 rounded-t-2xl ${config.bgColor} border-b border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg`}>
            <config.icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {config.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {config.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-lg overflow-hidden">
        <div className="p-6 space-y-6">
          {config.steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
            >
              {/* Step number */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                <span className={`text-sm font-bold ${config.iconColor}`}>
                  {step.number}
                </span>
              </div>

              {/* Step icon */}
              <div className="flex-shrink-0 mt-0.5">
                <step.icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>

              {/* Step content */}
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  {step.text}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {step.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer with tip and note */}
        <div className="px-6 pb-6 space-y-4">
          {config.tip && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <span className="font-semibold">💡 Consejo:</span> {config.tip}
              </p>
            </div>
          )}

          {config.note && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-semibold">📝 Nota:</span> {config.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InstallInstructions;
