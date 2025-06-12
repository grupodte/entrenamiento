import { Link } from 'react-router-dom';

const TerminosCondiciones = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 text-gray-800 font-inter">
            <h1 className="text-3xl font-bold mb-4">Términos y Condiciones de Uso</h1>
            <p className="text-sm text-gray-500 mb-8">Última actualización: 11 de junio de 2025</p>

            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Aceptación de los términos</h2>
                    <p>
                        Al registrarse o iniciar sesión en esta aplicación, ya sea mediante su correo electrónico o mediante el inicio de sesión con Facebook, usted declara que ha leído, comprendido y aceptado estos términos y nuestra <Link to="/privacidad" className="text-blue-600 underline">Política de Privacidad</Link>.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">2. Registro y autenticación</h2>
                    <p>
                        Utilizamos <strong>Supabase Auth</strong> como sistema de autenticación. Usted puede registrarse con su correo electrónico o utilizar su cuenta de <strong>Facebook</strong>. Al hacerlo, autoriza el acceso a información básica del perfil según los permisos otorgados.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">3. Almacenamiento y manejo de datos</h2>
                    <p>
                        Todos los datos personales se almacenan en <strong>Supabase</strong> de forma segura. No compartimos su información sin su consentimiento. Cumplimos con estándares de seguridad y regulaciones de privacidad vigentes.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">4. Uso aceptable</h2>
                    <ul className="list-disc list-inside">
                        <li>Usar la app solo para fines personales y legales.</li>
                        <li>No acceder a cuentas ajenas o datos no autorizados.</li>
                        <li>No distribuir contenido ofensivo, fraudulento o ilegal.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">5. Suspensión de cuenta</h2>
                    <p>
                        Podemos suspender o eliminar cuentas por uso indebido, fraude o incumplimiento, incluyendo falta de pago en planes activos.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">6. Actualizaciones y disponibilidad</h2>
                    <p>
                        La app puede actualizarse automáticamente como parte de su funcionamiento como PWA. Algunas funciones requieren conexión o permisos del dispositivo.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">7. Limitación de responsabilidad</h2>
                    <p>
                        La app se ofrece "tal como está". No garantizamos disponibilidad permanente ni exactitud completa en los datos.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">8. Cambios en los términos</h2>
                    <p>
                        Estos términos pueden modificarse en cualquier momento. Los cambios se comunicarán a través de esta página o por email si corresponde.
                    </p>
                </div>
            </section>

            <div className="mt-10 text-sm text-gray-600">
                <p>Para más información, contáctenos en: <a href="mailto:soporte@tusitio.com" className="text-blue-600 underline">soporte@tusitio.com</a></p>
            </div>
        </div>
    );
};

export default TerminosCondiciones;
