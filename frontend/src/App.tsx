import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import type { ReactElement } from 'react';
import Header from './components/header';
import MenuBar from './components/menubar';
import Footer from './components/footer';
import Chatbot from './components/chatbot';
import ProtectedRoute from './components/usuarios/ProtectedRoute';
import { EmptyState, LoadingState } from './components/ui/StateViews';
import type { UIRole } from './services/authApi';
import './App.css';

const InicioVideo = lazy(() => import('./components/inicioVideo'));
const AcercaDe = lazy(() => import('./components/acercade'));
const Services = lazy(() => import('./components/services'));
const Contact = lazy(() => import('./components/contact'));
const Login = lazy(() => import('./components/login'));
const Register = lazy(() => import('./components/register'));
const SimulacionRoles = lazy(() => import('./components/SimulacionRoles'));

const AdminDashboard = lazy(() => import('./components/usuarios/administrador/Dashboard'));
const CajeroDashboard = lazy(() => import('./components/usuarios/cajero/Dashboard'));
const DoctorDashboard = lazy(() => import('./components/usuarios/doctor/Dashboard'));
const EstudianteDashboard = lazy(() => import('./components/usuarios/estudiante/Dashboard'));
const InventarioDashboard = lazy(() => import('./components/usuarios/inventario/Dashboard'));
const ProveedorDashboard = lazy(() => import('./components/usuarios/proveedor/Dashboard'));
const RecepcionDashboard = lazy(() => import('./components/usuarios/recepcionista/Dashboard'));

const Usuarios = lazy(() => import('./components/usuarios/administrador/Usuarios'));
const Inventario = lazy(() => import('./components/usuarios/administrador/Inventario'));
const Doctores = lazy(() => import('./components/usuarios/administrador/Doctores'));
const Estudiantes = lazy(() => import('./components/usuarios/administrador/Estudiantes'));
const Reportes = lazy(() => import('./components/usuarios/administrador/Reportes'));
const Configuracion = lazy(() => import('./components/usuarios/administrador/Configuracion'));
const AdminCitas = lazy(() => import('./components/usuarios/administrador/Citas'));
const AdminPagos = lazy(() => import('./components/usuarios/administrador/Pagos'));
const AdminActividad = lazy(() => import('./components/usuarios/administrador/Actividad'));
const AdminPacientes = lazy(() => import('./components/usuarios/administrador/Pacientes'));

const RecepcionCitas = lazy(() => import('./components/usuarios/recepcionista/Citas'));
const RecepcionPacientes = lazy(() => import('./components/usuarios/recepcionista/Pacientes'));
const RecepcionPagos = lazy(() => import('./components/usuarios/recepcionista/Pagos'));

const Pacientes = lazy(() => import('./components/usuarios/estudiante/Pacientes'));
const Citas = lazy(() => import('./components/usuarios/estudiante/Citas'));
const Cursos = lazy(() => import('./components/usuarios/estudiante/Cursos'));
const Practicas = lazy(() => import('./components/usuarios/estudiante/Practicas'));
const EstudianteInsumos = lazy(() => import('./components/usuarios/estudiante/Insumos'));
const EstudiantePagos = lazy(() => import('./components/usuarios/estudiante/Pagos'));

const DoctorPacientes = lazy(() => import('./components/usuarios/doctor/Pacientes'));
const DoctorCitas = lazy(() => import('./components/usuarios/doctor/Citas'));
const DoctorTratamientos = lazy(() => import('./components/usuarios/doctor/Tratamientos'));
const DoctorEstudiantes = lazy(() => import('./components/usuarios/doctor/Estudiantes'));
const DoctorHistorial = lazy(() => import('./components/usuarios/doctor/Historial'));
const DoctorHorarios = lazy(() => import('./components/usuarios/doctor/Horarios'));
const DoctorCursos = lazy(() => import('./components/usuarios/doctor/Cursos'));

const InventarioProductos = lazy(() => import('./components/usuarios/inventario/Productos'));
const InventarioProveedores = lazy(() => import('./components/usuarios/inventario/Proveedores'));
const InventarioPedidos = lazy(() => import('./components/usuarios/inventario/Pedidos'));
const InventarioReportes = lazy(() => import('./components/usuarios/inventario/Reportes'));
const InventarioAlertas = lazy(() => import('./components/usuarios/inventario/Alertas'));
const InventarioCaducidades = lazy(() => import('./components/usuarios/inventario/Caducidades'));
const InventarioPrediccion = lazy(() => import('./components/usuarios/inventario/Prediccion'));
const InventarioMovimientos = lazy(() => import('./components/usuarios/inventario/Movimientos'));
const InventarioAnalitica = lazy(() => import('./components/usuarios/inventario/Analitica'));

function proteger(roles: UIRole[], element: ReactElement): ReactElement {
  return <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;
}

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="route-loading"><LoadingState label="Preparando la vista..." /></div>}>
        <Routes>
          {/* Administración */}
          <Route path="/admin/dashboard" element={proteger(['administrador'], <AdminDashboard />)} />
          <Route path="/admin/usuarios" element={proteger(['administrador'], <Usuarios />)} />
          <Route path="/admin/inventario" element={proteger(['administrador'], <Inventario />)} />
          <Route path="/admin/doctores" element={proteger(['administrador'], <Doctores />)} />
          <Route path="/admin/estudiantes" element={proteger(['administrador'], <Estudiantes />)} />
          <Route path="/admin/pacientes" element={proteger(['administrador'], <AdminPacientes />)} />
          <Route path="/admin/reportes" element={proteger(['administrador'], <Reportes />)} />
          <Route path="/admin/configuracion" element={proteger(['administrador'], <Configuracion />)} />
          <Route path="/admin/citas" element={proteger(['administrador'], <AdminCitas />)} />
          <Route path="/admin/pagos" element={proteger(['administrador'], <AdminPagos />)} />
          <Route path="/admin/actividad" element={proteger(['administrador'], <AdminActividad />)} />
          <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Recepción */}
          <Route path="/recepcionista/dashboard" element={proteger(['recepcionista'], <RecepcionDashboard />)} />
          <Route path="/recepcionista/citas" element={proteger(['recepcionista'], <RecepcionCitas />)} />
          <Route path="/recepcionista/pacientes" element={proteger(['recepcionista'], <RecepcionPacientes />)} />
          <Route path="/recepcionista/pagos" element={proteger(['recepcionista'], <RecepcionPagos />)} />
          <Route path="/recepcionista/*" element={<Navigate to="/recepcionista/dashboard" replace />} />

          {/* Estudiante */}
          <Route path="/estudiante/dashboard" element={proteger(['estudiante'], <EstudianteDashboard />)} />
          <Route path="/estudiante/pacientes" element={proteger(['estudiante'], <Pacientes />)} />
          <Route path="/estudiante/citas" element={proteger(['estudiante'], <Citas />)} />
          <Route path="/estudiante/cursos" element={proteger(['estudiante'], <Cursos />)} />
          <Route path="/estudiante/practicas" element={proteger(['estudiante'], <Practicas />)} />
          <Route path="/estudiante/insumos" element={proteger(['estudiante'], <EstudianteInsumos />)} />
          <Route path="/estudiante/pagos" element={proteger(['estudiante'], <EstudiantePagos />)} />
          <Route path="/estudiante/*" element={<Navigate to="/estudiante/dashboard" replace />} />

          {/* Cajero */}
          <Route path="/cajero/dashboard" element={proteger(['cajero'], <CajeroDashboard />)} />
          <Route path="/cajero/*" element={<Navigate to="/cajero/dashboard" replace />} />

          {/* Doctor / Docente */}
          <Route path="/doctor/dashboard" element={proteger(['doctor'], <DoctorDashboard />)} />
          <Route path="/doctor/pacientes" element={proteger(['doctor'], <DoctorPacientes />)} />
          <Route path="/doctor/citas" element={proteger(['doctor'], <DoctorCitas />)} />
          <Route path="/doctor/tratamientos" element={proteger(['doctor'], <DoctorTratamientos />)} />
          <Route path="/doctor/estudiantes" element={proteger(['doctor'], <DoctorEstudiantes />)} />
          <Route path="/doctor/historial" element={proteger(['doctor'], <DoctorHistorial />)} />
          <Route path="/doctor/horarios" element={proteger(['doctor'], <DoctorHorarios />)} />
          <Route path="/doctor/cursos" element={proteger(['doctor'], <DoctorCursos />)} />
          <Route path="/doctor/*" element={<Navigate to="/doctor/dashboard" replace />} />

          {/* Inventario */}
          <Route path="/inventario/dashboard" element={proteger(['inventario'], <InventarioDashboard />)} />
          <Route path="/inventario/productos" element={proteger(['inventario'], <InventarioProductos />)} />
          <Route path="/inventario/proveedores" element={proteger(['inventario'], <InventarioProveedores />)} />
          <Route path="/inventario/pedidos" element={proteger(['inventario'], <InventarioPedidos />)} />
          <Route path="/inventario/reportes" element={proteger(['inventario'], <InventarioReportes />)} />
          <Route path="/inventario/alertas" element={proteger(['inventario'], <InventarioAlertas />)} />
          <Route path="/inventario/caducidades" element={proteger(['inventario'], <InventarioCaducidades />)} />
          <Route path="/inventario/prediccion" element={proteger(['inventario'], <InventarioPrediccion />)} />
          <Route path="/inventario/movimientos" element={proteger(['inventario'], <InventarioMovimientos />)} />
          <Route path="/inventario/analitica" element={proteger(['inventario'], <InventarioAnalitica />)} />
          <Route path="/alertas" element={proteger(['inventario'], <InventarioAlertas />)} />
          <Route path="/caducidades" element={proteger(['inventario'], <InventarioCaducidades />)} />
          <Route path="/prediccion" element={proteger(['inventario'], <InventarioPrediccion />)} />
          <Route path="/reportes" element={proteger(['inventario'], <InventarioReportes />)} />
          <Route path="/analitica" element={proteger(['inventario'], <InventarioAnalitica />)} />
          <Route path="/inventario/*" element={<Navigate to="/inventario/dashboard" replace />} />

          {/* Proveedor */}
          <Route path="/proveedor/dashboard" element={proteger(['proveedor'], <ProveedorDashboard />)} />
          <Route path="/proveedor/*" element={<Navigate to="/proveedor/dashboard" replace />} />

          {/* Simulación y autenticación */}
          <Route path="/sim-admin" element={<SimulacionRoles />} />
          <Route path="/simulacion-roles" element={<Navigate to="/sim-admin" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Público */}
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
                  <Route path="*" element={
                    <div className="page-not-found">
                      <EmptyState message="La página solicitada no existe o ya no está disponible." />
                      <a className="add-button" href="/">Volver al inicio</a>
                    </div>
                  } />
                </Routes>
              </main>
              <Chatbot />
              <Footer />
            </>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
