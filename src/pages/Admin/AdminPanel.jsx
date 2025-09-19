const AdminPanel = () => (
  <div className=" inset-0 w-full h-full  bg-cover bg-center mt-[25px] items-center">
    <div className=" inset-0 backdrop-blur-sm " />

    <div className="relative z-10 max-w-[500px] mx-auto px-6 py-8 rounded-xl bg-white/5 backdrop-blur-md shadow-md border border-white/10 text-white">
      <h1 className="text-2xl font-bold mb-4">Bienvenido al Dashboard del entrenador</h1>
      <p className="text-gray-200 mb-4">  
        Ahora puedes crear ejercicios, rutinas y asignarlas a alumnos. ¡También puedes organizarlos en grupos para asignaciones masivas!
      </p>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
          <div className="text-blue-400 font-semibold">👥 Grupos</div>
          <div className="text-sm text-gray-300 mt-1">Organiza alumnos</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
          <div className="text-orange-400 font-semibold">🏋️ Rutinas</div>
          <div className="text-sm text-gray-300 mt-1">Asigna masivamente</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
          <div className="text-purple-400 font-semibold">📚 Cursos</div>
          <div className="text-sm text-gray-300 mt-1">Acceso por grupos</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <div className="text-green-400 font-semibold">⚡ Eficiencia</div>
          <div className="text-sm text-gray-300 mt-1">Gestión rápida</div>
        </div>
      </div>
    </div>
  </div>
);

export default AdminPanel;
