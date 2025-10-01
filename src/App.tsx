import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/header';
import MenuBar from './components/menubar';
import InicioVideo from './components/inicioVideo';
import AcercaDe from './components/acercade';
import Services from './components/services';
import Contact from './components/contact';
import Login from './components/login';
import Register from './components/register';
import Footer from './components/footer';
import Chatbot from './components/chatbot';
import SimulacionRoles from './components/SimulacionRoles';

// Dashboards de usuarios
import AdminDashboard from './components/usuarios/administrador/Dashboard';
import CajeroDashboard from './components/usuarios/cajero/Dashboard';
import DoctorDashboard from './components/usuarios/doctor/Dashboard';
import EstudianteDashboard from './components/usuarios/estudiante/Dashboard';
import InventarioDashboard from './components/usuarios/inventario/Dashboard';
import ProveedorDashboard from './components/usuarios/proveedor/Dashboard';

// Páginas de administrador
import Usuarios from './components/usuarios/administrador/Usuarios';
import Inventario from './components/usuarios/administrador/Inventario';
import Doctores from './components/usuarios/administrador/Doctores';
import Estudiantes from './components/usuarios/administrador/Estudiantes';
import Reportes from './components/usuarios/administrador/Reportes';
import Configuracion from './components/usuarios/administrador/Configuracion';

// Páginas de estudiante
import Pacientes from './components/usuarios/estudiante/Pacientes';
import Citas from './components/usuarios/estudiante/Citas';
import Cursos from './components/usuarios/estudiante/Cursos';
import Practicas from './components/usuarios/estudiante/Practicas';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas para los Dashboards y páginas de administración que NO deben tener Header y Footer */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
        <Route path="/admin/inventario" element={<Inventario />} />
        <Route path="/admin/doctores" element={<Doctores />} />
        <Route path="/admin/estudiantes" element={<Estudiantes />} />
        <Route path="/admin/reportes" element={<Reportes />} />
        <Route path="/admin/configuracion" element={<Configuracion />} />
        
        {/* Rutas para estudiante */}
        <Route path="/estudiante/dashboard" element={<EstudianteDashboard />} />
        <Route path="/estudiante/pacientes" element={<Pacientes />} />
        <Route path="/estudiante/citas" element={<Citas />} />
        <Route path="/estudiante/cursos" element={<Cursos />} />
        <Route path="/estudiante/practicas" element={<Practicas />} />
        
        <Route path="/cajero/*" element={<CajeroDashboard />} />
        <Route path="/doctor/*" element={<DoctorDashboard />} />
        <Route path="/inventario/*" element={<InventarioDashboard />} />
        <Route path="/proveedor/*" element={<ProveedorDashboard />} />
        <Route path="/sim-admin" element={<SimulacionRoles />} /> {/* Mantén la ruta de simulación fuera también */}

        {/* Ruta principal que renderiza el diseño general (Header, Menú, Footer)
          Esta ruta se usa para todas las páginas públicas
        */}
        <Route path="/*" element={
          <>
            <Header />
            <MenuBar />
            <main>
              <Routes>
                <Route path="/" element={<InicioVideo />} />
                <Route path="/acerca-de" element={<AcercaDe />} />
                <Route path="/servicio" element={<Services />} />
                <Route path="/contactos" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </main>
            <Chatbot />
            <Footer />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;