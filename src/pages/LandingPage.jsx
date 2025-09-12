import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Star, 
  Users, 
  Trophy, 
  Zap, 
  ArrowRight,
  CheckCircle,
  PlayCircle
} from 'lucide-react';

const LandingPage = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const navigate = useNavigate();

  const testimonials = [
    {
      name: "María González",
      role: "Perdió 15kg en 3 meses",
      content: "Los entrenamientos son increíbles, nunca había tenido resultados tan rápidos",
      avatar: "/avatars/maria.jpg",
      rating: 5
    },
    {
      name: "Carlos Ruiz",
      role: "Ganó 8kg de masa muscular",
      content: "Las rutinas personalizadas me ayudaron a romper mi plateau de años",
      avatar: "/avatars/carlos.jpg",
      rating: 5
    },
    {
      name: "Ana Martín",
      role: "Completó su primera maratón",
      content: "El plan de entrenamiento me preparó perfectamente para mi objetivo",
      avatar: "/avatars/ana.jpg",
      rating: 5
    }
  ];

  const features = [
    {
      icon: Trophy,
      title: "Rutinas Personalizadas",
      description: "Entrenamientos diseñados específicamente para tus objetivos y nivel"
    },
    {
      icon: Play,
      title: "Videos HD Explicativos",
      description: "Cada ejercicio con demostración en alta calidad paso a paso"
    },
    {
      icon: Zap,
      title: "Seguimiento Inteligente",
      description: "Rastrea tu progreso automáticamente y ajusta tu plan"
    },
    {
      icon: Users,
      title: "Comunidad Activa",
      description: "Conecta con otros usuarios y mantente motivado"
    }
  ];

  const stats = [
    { number: "10K+", label: "Usuarios Activos" },
    { number: "95%", label: "Tasa de Éxito" },
    { number: "500+", label: "Rutinas Diferentes" },
    { number: "24/7", label: "Soporte" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
              initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }}
              animate={{ 
                y: [0, -30, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.5, 1]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Transforma Tu Cuerpo
          </motion.h1>
          
          <motion.h2 
            className="text-2xl md:text-3xl mb-8 text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Con Entrenamientos Que Realmente Funcionan
          </motion.h2>
          
          <motion.p 
            className="text-lg md:text-xl mb-12 text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Únete a miles de personas que ya han logrado sus objetivos fitness 
            con nuestros planes personalizados y seguimiento profesional.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              Comenzar Gratis <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/cursos')}
              className="border-2 border-purple-400 hover:bg-purple-400/10 text-purple-400 font-bold py-4 px-8 rounded-full flex items-center gap-2 transition-all duration-300"
            >
              <PlayCircle className="w-5 h-5" /> Ver Cursos
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Por Qué Elegir <span className="text-purple-400">FitApp</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Nuestra plataforma combina ciencia deportiva con tecnología 
              para darte los mejores resultados posibles.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl hover:bg-gray-700/50 transition-all duration-300 transform hover:scale-105"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <feature.icon className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Historias de <span className="text-purple-400">Éxito</span>
            </h2>
            <p className="text-xl text-gray-400">
              Descubre cómo otros han transformado sus vidas
            </p>
          </motion.div>

          <div className="relative h-64">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 backdrop-blur-sm border border-purple-400/20"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-col h-full justify-center">
                  <div className="flex mb-4">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-lg md:text-xl italic mb-6 text-center">
                    "{testimonials[currentTestimonial].content}"
                  </p>
                  
                  <div className="text-center">
                    <p className="font-bold text-purple-400">
                      {testimonials[currentTestimonial].name}
                    </p>
                    <p className="text-gray-400">
                      {testimonials[currentTestimonial].role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Testimonial Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial 
                      ? 'bg-purple-400' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="py-20 px-4 bg-black/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prueba <span className="text-purple-400">Gratis</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Accede a contenido de muestra y descubre por qué somos 
              la plataforma fitness #1 elegida por profesionales.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Rutina de Fuerza", duration: "45 min", level: "Intermedio" },
              { title: "Cardio HIIT", duration: "20 min", level: "Todos" },
              { title: "Yoga Recovery", duration: "30 min", level: "Principiante" }
            ].map((preview, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="aspect-video bg-gradient-to-br from-purple-600 to-pink-600 relative flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{preview.title}</h3>
                  <div className="flex justify-between text-gray-400">
                    <span>{preview.duration}</span>
                    <span>{preview.level}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Listo Para Cambiar Tu Vida?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Únete hoy y comienza tu transformación. 
              Primeros 7 días gratis, cancela cuando quieras.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              >
                Comenzar Mi Transformación <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="text-purple-400 hover:text-purple-300 font-bold py-4 px-8 transition-all duration-300"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Sin permanencia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Soporte 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Garantía de resultados</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
