import React, { useState } from 'react';
import { 
  DevicePhoneMobileIcon, 
  WifiIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import InstallButton, { InstallBanner } from '../components/InstallButton';
import usePWAInstall from '../hooks/usePWAInstall';

const InstalarApp = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const { isInstalled, getBrowserInfo } = usePWAInstall();
  const browserInfo = getBrowserInfo();

  const benefits = [
    {
      icon: BoltIcon,
      title: "Acceso Ultra Rápido",
      description: "Inicia la app directamente desde tu escritorio o pantalla de inicio, sin abrir el navegador."
    },
    {
      icon: WifiIcon,
      title: "Funciona Sin Internet",
      description: "Accede a tus rutinas y datos principales incluso cuando no tengas conexión a internet."
    },
    {
      icon: ShieldCheckIcon,
      title: "Segura y Actualizada",
      description: "Se actualiza automáticamente en segundo plano manteniendo siempre la última versión."
    },
    {
      icon: DevicePhoneMobileIcon,
      title: "Experiencia Nativa",
      description: "Interfaz optimizada que se ve y funciona como una aplicación nativa en tu dispositivo."
    }
  ];

  const installSteps = {
    chrome: [
      {
        step: 1,
        title: "Presiona el botón 'Instalar App'",
        description: "Verás un botón azul en esta página o un ícono de instalación en la barra de direcciones."
      },
      {
        step: 2,
        title: "Confirma la instalación",
        description: "Aparecerá un diálogo preguntándote si quieres instalar FitApp. Haz clic en 'Instalar'."
      },
      {
        step: 3,
        title: "¡Listo para usar!",
        description: "La app se instalará automáticamente y aparecerá un acceso directo en tu escritorio."
      }
    ],
    ios: [
      {
        step: 1,
        title: "Abre el menú de compartir",
        description: "Toca el ícono de compartir (⬆️) en la parte inferior de la pantalla de Safari."
      },
      {
        step: 2,
        title: "Selecciona 'Añadir a pantalla de inicio'",
        description: "Desplázate hacia abajo y busca la opción 'Añadir a pantalla de inicio'."
      },
      {
        step: 3,
        title: "Confirma y personaliza",
        description: "Puedes cambiar el nombre si quieres y luego toca 'Añadir' en la esquina superior derecha."
      }
    ],
    android: [
      {
        step: 1,
        title: "Busca la opción de instalación",
        description: "Toca el menú (⋮) del navegador o busca 'Instalar app' en la barra de direcciones."
      },
      {
        step: 2,
        title: "Selecciona 'Instalar' o 'Añadir a pantalla de inicio'",
        description: "La opción exacta puede variar según tu navegador, pero generalmente dice 'Instalar'."
      },
      {
        step: 3,
        title: "Confirma la instalación",
        description: "Acepta los permisos si se solicitan y la app se instalará automáticamente."
      }
    ]
  };

  const faqItems = [
    {
      question: "¿Qué es una PWA (Progressive Web App)?",
      answer: "Una PWA es una aplicación web que funciona como una app nativa. Se puede instalar en tu dispositivo, funciona sin internet (parcialmente) y ofrece una experiencia similar a las apps de la tienda."
    },
    {
      question: "¿Es seguro instalar esta aplicación?",
      answer: "Sí, es completamente seguro. Las PWAs se ejecutan en el mismo entorno seguro que tu navegador web y no requieren permisos especiales del sistema operativo."
    },
    {
      question: "¿Ocupa espacio en mi dispositivo?",
      answer: "Sí, pero mucho menos que una app tradicional. Generalmente ocupa entre 5-20 MB dependiendo del contenido almacenado en caché."
    },
    {
      question: "¿Puedo desinstalarla?",
      answer: "Sí, puedes desinstalarla como cualquier otra aplicación desde la configuración de tu dispositivo o haciendo clic derecho sobre el icono."
    },
    {
      question: "¿Funciona en todos los navegadores?",
      answer: "Funciona mejor en Chrome, Edge, Safari (iOS 11.3+) y la mayoría de navegadores modernos. Firefox tiene soporte limitado."
    }
  ];

  const getCurrentSteps = () => {
    if (browserInfo.isIOS) return installSteps.ios;
    if (browserInfo.isChrome || browserInfo.isEdge) return installSteps.chrome;
    return installSteps.android;
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Volver al inicio
            </Link>
            
            <div className="bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-8 text-center">
              <div className="text-green-600 dark:text-green-400 mb-4">
                <ShieldCheckIcon className="w-16 h-16 mx-auto" />
              </div>
              <h1 className="text-3xl font-bold text-green-800 dark:text-green-200 mb-4">
                ¡FitApp ya está instalada! 🎉
              </h1>
              <p className="text-green-700 dark:text-green-300 text-lg">
                Puedes acceder a la aplicación directamente desde tu escritorio o pantalla de inicio.
              </p>
              <div className="mt-6">
                <Link 
                  to="/dashboard"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Abrir FitApp
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Volver al inicio
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Instala <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">FitApp</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Convierte FitApp en una aplicación nativa en tu dispositivo. Acceso rápido, funciona sin internet y se actualiza automáticamente.
          </p>

          {/* Banner de instalación */}
          <div className="mb-8">
            <InstallBanner className="max-w-3xl mx-auto" />
          </div>

          {/* Botones de instalación principales */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <InstallButton 
              variant="primary"
              size="lg"
              className="transform hover:scale-105"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 px-4">
              Gratis • Sin publicidad • Actualización automática
            </p>
          </div>
        </div>

        {/* Beneficios */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            ¿Por qué instalar FitApp?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparación Antes/Después */}
        <section className="mb-16 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Antes vs Después de instalar
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Antes */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                😫 Sin instalar
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>✗ Buscar la pestaña del navegador</li>
                <li>✗ Depende de la conexión a internet</li>
                <li>✗ Se puede cerrar por accidente</li>
                <li>✗ Menos fluida en el móvil</li>
              </ul>
            </div>
            
            {/* Después */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">
                🚀 Instalada
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>✓ Un clic desde el escritorio</li>
                <li>✓ Funciona parcialmente sin internet</li>
                <li>✓ App independiente y estable</li>
                <li>✓ Experiencia móvil optimizada</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Instrucciones paso a paso */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Cómo instalar FitApp
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="mb-6">
              <p className="text-center text-gray-600 dark:text-gray-300">
                Detectamos que estás usando: <span className="font-medium text-blue-600 dark:text-blue-400">
                  {browserInfo.isIOS ? 'Safari en iOS' : 
                   browserInfo.isChrome ? 'Chrome' : 
                   browserInfo.isFirefox ? 'Firefox' : 
                   browserInfo.isEdge ? 'Microsoft Edge' : 'Otro navegador'}
                </span>
              </p>
            </div>
            
            <div className="space-y-6">
              {getCurrentSteps().map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm text-center">
                💡 <strong>Tip:</strong> Si no ves la opción de instalar, asegúrate de que estás usando un navegador compatible y que la página esté completamente cargada.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {item.question}
                  </h3>
                  {expandedFaq === index ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Listo para una mejor experiencia?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Instala FitApp ahora y disfruta de acceso instantáneo, funcionalidad offline y actualizaciones automáticas.
          </p>
          <div className="space-y-4">
            <InstallButton 
              variant="secondary"
              size="lg"
              customText="Instalar FitApp Ahora"
            />
            <p className="text-blue-200 text-sm">
              La instalación es gratuita y toma menos de 30 segundos
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InstalarApp;
