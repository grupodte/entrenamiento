import { Link } from 'react-router-dom';

const PoliticaPrivacidad = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 text-gray-800 font-inter">
            <h1 className="text-3xl font-bold mb-4">Política de Privacidad</h1>
            <p className="text-sm text-gray-500 mb-8">Última actualización: 11 de junio de 2025</p>

            <section className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Información que recopilamos</h2>
                    <p>
                        Recopilamos información personal que usted nos proporciona al registrarse o utilizar la aplicación, incluyendo su nombre, correo electrónico, foto de perfil y cualquier dato relacionado con su actividad dentro de la plataforma.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">2. Autenticación con Facebook</h2>
                    <p>
                        Si elige iniciar sesión mediante Facebook, accedemos únicamente a la información permitida por usted a través de los permisos concedidos. No publicamos ni compartimos contenido en su nombre sin autorización.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">3. Uso de los datos</h2>
                    <p>
                        Utilizamos sus datos para:
                        <ul className="list-disc list-inside mt-2">
                            <li>Brindar acceso a funcionalidades personalizadas.</li>
                            <li>Mejorar su experiencia de usuario.</li>
                            <li>Ofrecer soporte técnico y actualizaciones.</li>
                        </ul>
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">4. Almacenamiento seguro</h2>
                    <p>
                        Sus datos son almacenados en <strong>Supabase</strong>, una plataforma segura que cumple con estándares internacionales de protección de datos. No vendemos ni transferimos su información a terceros sin su consentimiento.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">5. Cookies y tecnologías similares</h2>
                    <p>
                        Esta aplicación puede utilizar cookies o almacenamiento local del navegador para recordar su sesión y mejorar la experiencia. Usted puede desactivar las cookies desde su navegador, aunque esto puede afectar el funcionamiento de algunas funciones.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">6. Derechos del usuario</h2>
                    <p>
                        Usted tiene derecho a acceder, corregir, eliminar o limitar el uso de sus datos personales en cualquier momento. Puede contactarnos para ejercer estos derechos.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">7. Eliminación de cuenta y datos</h2>
                    <p>
                        Si desea eliminar su cuenta y todos sus datos, puede hacerlo desde el panel de usuario o escribiéndonos directamente. El proceso puede demorar hasta 7 días hábiles.
                    </p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">8. Cambios en esta política</h2>
                    <p>
                        Esta política puede ser modificada en cualquier momento. Publicaremos cualquier cambio en esta página. Recomendamos revisarla periódicamente.
                    </p>
                </div>
            </section>

            <div className="mt-10 text-sm text-gray-600">
                <p>Si tiene dudas o desea ejercer sus derechos, escríbanos a: <a href="mailto:soporte@tusitio.com" className="text-blue-600 underline">soporte@tusitio.com</a></p>
                <p className="mt-2">
                    También puede revisar nuestros <Link to="/terminos" className="text-blue-600 underline">Términos y Condiciones</Link>.
                </p>
            </div>
        </div>
    );
};

export default PoliticaPrivacidad;
