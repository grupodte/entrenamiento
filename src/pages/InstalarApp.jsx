import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Share, PlusSquare, EllipsisVertical, Download } from "lucide-react";
import { motion } from 'framer-motion';

// Página simple y universal de instalación de PWA
// - Muestra pasos claros para iOS, Android y Desktop
// - Si el navegador dispara beforeinstallprompt (Android/desktop Chrome), ofrece botón "Instalar"
// - Si ya está instalada (standalone), muestra confirmación
// - Sin dependencias extra

export default function InstalarAppSimple() {
  const navigate = useNavigate?.() ?? (() => { });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Detecciones básicas de plataforma / modo
  const { isStandalone, isIOS, isAndroid, isDesktop } = useMemo(() => {
    const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const displayStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(display-mode: standalone)")?.matches ||
        // iOS Safari
        (typeof navigator !== "undefined" && (navigator).standalone === true));

    return {
      isStandalone: displayStandalone,
      isIOS,
      isAndroid,
      isDesktop: !isIOS && !isAndroid,
    };
  }, []);

  useEffect(() => {
    if (isStandalone) {
      setInstalled(true);
    }
  }, [isStandalone]);

  useEffect(() => {
    // Capturamos el evento para poder disparar el prompt manualmente
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Detectar instalación completada
    const onAppInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return; // En iOS no existe; mostrar instrucciones abajo
    try {
      setInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // Reset del evento (solo se puede usar una vez)
      setDeferredPrompt(null);
      setInstalling(false);
      if (outcome === "accepted") {
        // El evento appinstalled nos actualizará el estado
      }
    } catch (err) {
      setInstalling(false);
    }
  };

  const steps = useMemo(() => {
    if (installed) {
      return [{ title: "¡Listo!", desc: "La app ya está instalada en tu dispositivo." }];
    }

    if (isIOS) {
      return [
        { title: "Abrí en Safari o tu navegador", desc: "En iOS podés usar Safari, Chrome, ARC el que quieras. La opción 'Agregar a inicio' aparece desde el menú de compartir.", icon: null },
        { title: "Tocá Compartir", desc: "Presioná el ícono de compartir (cuadrado con flecha hacia arriba).", icon: Share },
        { title: "Agregar a Inicio", desc: "Deslizá y elegí 'Agregar a la pantalla de inicio'. Confirmá con 'Agregar'.", icon: PlusSquare },
      ];
    }

    if (isAndroid) {
      return [
        { title: "Menú del navegador", desc: "Tocá el menú (⋮) en la barra superior de tu navegador.", icon: EllipsisVertical },
        { title: "Instalar app", desc: "Elegí 'Instalar app' o 'Agregar a la pantalla de inicio'.", icon: Download },
        { title: "Confirmá", desc: "Aceptá el diálogo para instalar la PWA.", icon: null },
      ];
    }

    // Desktop
    return [
      { title: "Menú del navegador", desc: "Abrí el menú (Chrome/Edge) o la barra de direcciones (ícono de instalación si aparece).", icon: EllipsisVertical },
      { title: "Instalar", desc: "Seleccioná 'Instalar app' / 'Instalar FitApp' y confirmá.", icon: Download },
      { title: "Atajo en tu escritorio", desc: "La app quedará como una ventana propia, sin barra del navegador.", icon: null },
    ];
  }, [installed, isIOS, isAndroid]);


  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Video de fondo */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/backgrounds/loginbg.mp4" type="video/mp4" />
      </video>

      {/* Capa oscura */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-lg"></div>

      <div className="relative z-10 w-full max-w-xl p-4">
        {/* Card con animación */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
          className="rounded-2xl border border-gray-700/10 bg-gray-900/30 backdrop-blur-sm shadow-2xl"
        >
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {installed ? "La app ya está instalada" : "Instalá la app en tu dispositivo"}
            </h1>
            <p className="mt-2 text-neutral-300 text-sm md:text-base">
              {installed
                ? "Podés abrirla desde tu pantalla de inicio o lista de aplicaciones."
                : isIOS
                  ? "En iPhone/iPad, la instalación se hace desde el menú Compartir de Safari."
                  : isAndroid
                    ? "En Android, podés instalar desde el menú del navegador. Si aparece el diálogo, usá el botón de abajo."
                    : "En escritorio (Chrome/Edge), instalá desde el menú del navegador o el ícono en la barra de direcciones."}
            </p>

            {/* Steps */}
            <ol className="mt-6 space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex-none w-8 h-8 rounded-full bg-white/10 border border-white/15 grid place-items-center font-semibold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {s.icon ? <s.icon size={16} className="opacity-80" /> : null}
                      {s.title}
                    </div>
                    <div className="text-neutral-300 text-sm">{s.desc}</div>
                  </div>

                </li>
              ))}
            </ol>

            {/* Install CTA (solo cuando existe el evento) */}
            {!installed && deferredPrompt && (
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="mt-6 w-full rounded-xl bg-cyan-500/90 hover:bg-cyan-400 transition py-3 font-semibold shadow-lg shadow-cyan-500/30 border border-cyan-400/30"
              >
                {installing ? "Instalando…" : "Instalar ahora"}
              </button>
            )}

            {/* Tips extra */}
            {!installed && !deferredPrompt && (
              <p className="mt-6 text-xs text-neutral-200">
                {isIOS
                  ? "Tip: Si no ves la opción, asegurate de que el sitio tenga conexión segura (https) y esté cargado en Safari."
                  : isAndroid
                    ? "Tip: Si no aparece 'Instalar', navegá un poco por la app y volvé. A veces el navegador demora en habilitar la instalación."
                    : "Tip: En Chrome/Edge, el ícono de 'instalar' puede aparecer a la derecha de la barra de direcciones."}
              </p>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-neutral-200">
          Esta es una PWA. Una vez instalada, funciona como una app nativa.
        </div>
      </div>
    </div>
  );
}
