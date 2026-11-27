import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../components/usuarios/UserRedirect', () => ({
  default: ({ userType, userName }: { userType: string; userName: string }) => (
    <div data-testid="user-redirect">
      <span data-testid="role">{userType}</span>
      <span data-testid="name">{userName}</span>
    </div>
  ),
}))

const { USUARIOS } = vi.hoisted(() => ({
  USUARIOS: {
    'admin@odontopro.local': { rol: 'administrador', nombre: 'Ana Administradora' },
    'docente@odontopro.local': { rol: 'docente', nombre: 'Carlos Docente' },
    'estudiante@odontopro.local': { rol: 'estudiante', nombre: 'Elena Estudiante' },
    'recepcionista@odontopro.local': { rol: 'recepcionista', nombre: 'Lucía Recepción' },
    'inventario@odontopro.local': { rol: 'inventario', nombre: 'María Almacén' },
  } as Record<string, { rol: string; nombre: string }>,
}))

vi.mock('../services/authApi', () => ({
  login: vi.fn(async ({ email }: { email: string }) => {
    const found = USUARIOS[email.toLowerCase()]
    if (!found) throw new Error('Credenciales incorrectas')
    return {
      id: 1,
      nombre: found.nombre.split(' ')[0],
      apellido: found.nombre.split(' ').slice(1).join(' '),
      nombreCompleto: found.nombre,
      email,
      rol: found.rol,
      telefono: null,
      ci: null,
      especialidad: null,
      semestre: null,
      empresa: null,
      proveedorId: null,
      estado: 'activo',
      fechaRegistro: '01/01/2026',
      fechaRegistroISO: '2026-01-01',
    }
  }),
  displayName: (user: { nombreCompleto: string }) => user.nombreCompleto,
}))

const mockedNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

import Login from '../components/login'
import { login } from '../services/authApi'

function renderWithRouter(ui: React.ReactElement, initialEntries: React.ComponentProps<typeof MemoryRouter>['initialEntries'] = ['/']) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>)
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockedNavigate.mockReset()
  vi.mocked(login).mockClear()
})

describe('Login Component', () => {
  it('renderiza campos de email y contraseña', () => {
    renderWithRouter(<Login />)
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar al portal/i })).toBeInTheDocument()
  })

  it('muestra error si se envía sin datos', () => {
    renderWithRouter(<Login />)
    const form = screen.getByRole('button', { name: /ingresar al portal/i }).closest('form')!
    fireEvent.submit(form)
    expect(screen.getByText(/complete todos los campos/i)).toBeInTheDocument()
  })

  it('muestra "Procesando..." y deshabilita el botón durante la autenticación real', async () => {
    vi.mocked(login).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        id: 1,
        nombre: 'Ana',
        apellido: 'Administradora',
        nombreCompleto: 'Ana Administradora',
        email: 'admin@odontopro.local',
        rol: 'administrador' as const,
        telefono: null,
        ci: null,
        especialidad: null,
        semestre: null,
        empresa: null,
        proveedorId: null,
        estado: 'activo' as const,
        fechaRegistro: '01/01/2026',
        fechaRegistroISO: '2026-01-01',
        direccion: null,
        fechaNacimiento: null,
        genero: null,
        tituloAcademico: null,
        departamento: null,
        horarioAtencion: null,
        biografia: null,
        tipoSemestre: null,
        carrera: null,
        grupo: null,
        turno: null,
        observaciones: null,
      }), 50))
    )
    renderWithRouter(<Login />)

    await userEvent.type(screen.getByLabelText(/correo/i), 'admin@odontopro.local')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'Admin123!')

    const submitBtn = screen.getByRole('button', { name: /ingresar al portal/i })
    await userEvent.click(submitBtn)

    expect(submitBtn).toBeDisabled()
    expect(submitBtn).toHaveTextContent(/procesando/i)
  })

  it('redirige a UserRedirect con el rol devuelto por la API', async () => {
    renderWithRouter(<Login />)

    await userEvent.type(screen.getByLabelText(/correo/i), 'admin@odontopro.local')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'Admin123!')
    await userEvent.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    const redirect = await screen.findByTestId('user-redirect', {}, { timeout: 2000 })
    expect(within(redirect).getByTestId('role')).toHaveTextContent('administrador')
    expect(within(redirect).getByTestId('name')).toHaveTextContent('Ana Administradora')
  })

  it('navega a /register al hacer clic en "Regístrese"', async () => {
    renderWithRouter(<Login />)
    const regLink = screen.getByRole('button', { name: /regístrese/i })
    await userEvent.click(regLink)
    expect(mockedNavigate).toHaveBeenCalledWith('/register')
  })

  it('prellena correo y contraseña desde location.state', () => {
    renderWithRouter(<Login />, [{
      pathname: '/login',
      state: {
        userEmail: 'docente@odontopro.local',
        userPassword: 'Docente123!',
      },
    }])

    expect((screen.getByLabelText(/correo/i) as HTMLInputElement).value).toBe('docente@odontopro.local')
    expect((screen.getByLabelText(/contraseña/i) as HTMLInputElement).value).toBe('Docente123!')
  })

  it('usa el rol inventario devuelto por la API', async () => {
    renderWithRouter(<Login />)

    await userEvent.type(screen.getByLabelText(/correo/i), 'inventario@odontopro.local')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'Inventario123!')
    await userEvent.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    const redirect = await screen.findByTestId('user-redirect', {}, { timeout: 2000 })
    expect(within(redirect).getByTestId('role')).toHaveTextContent('inventario')
    expect(within(redirect).getByTestId('name')).toHaveTextContent('María Almacén')
  })
})
