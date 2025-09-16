import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const PoliticaPrivacidad = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 text-gray-800 font-inter">
            <Helmet>
                <title>Política de Privacidad | Tu App</title>
                <meta name="description" content="Lee nuestra política de privacidad para conocer cómo protegemos tu información." />
                <link rel="canonical" href="https://tuapp.com/politica" />
                <meta name="robots" content="index, follow" />
            </Helmet>

            <h1 className="text-3xl font-bold mb-4">Política de Privacidad</h1>
            <p className="text-sm text-gray-500 mb-8">Última actualización: 11 de junio de 2025</p>

            <section className="space-y-6 text-base leading-relaxed">
                <div>
                    <h2 className="text-xl font-semibold mb-2">1. Información que recopilamos</h2>
                    <p>Recopilamos información personal como nombre, correo electrónico y foto de perfil.</p>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">2. Autenticación con Facebook</h2>
                    <p>Accedemos únicamente a la información permitida por usted. No publicamos sin permiso.</p>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">3. Uso de los datos</h2>
                    <ul className="list-disc list-inside mt-2">
                        <li>Personalizar su experiencia.</li>
                        <li>Brindar soporte.</li>
                        <li>Mejorar el servicio.</li>
                    </ul>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">4. Almacenamiento seguro</h2>
                    <p>Usamos Supabase, cumpliendo estándares internacionales de protección.</p>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">5. Derechos del usuario</h2>
                    <p>Puede acceder, modificar o eliminar sus datos en cualquier momento.</p>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-2">6. Contacto</h2>
                    <p>Para consultas o ejercer sus derechos, escríbanos a <a href="mailto:soporte@tuapp.com" className="text-blue-600 underline">soporte@tuapp.com</a></p>
                </div>
            </section>

            <div className="mt-10 text-sm text-gray-600">
                <p>Lea también nuestros <Link to="/terminos" className="text-blue-600 underline">Términos y Condiciones</Link>.</p>
            </div>
        </div>
    );
};

export default PoliticaPrivacidad;
