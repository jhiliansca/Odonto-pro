import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ---- MOCKS ----

// Mock del componente UserRedirect (la ruta debe coincidir con la usada en Login.tsx)
vi.mock('../components/usuarios/UserRedirect', () => ({
  default: ({ userType, userName }: { userType: string; userName: string }) => (
    <div data-testid="user-redirect">
      <span data-testid="role">{userType}</span>
      <span data-testid="name">{userName}</span>
    </div>
  ),
}))

// Mock parcial de react-router-dom para capturar navigate()
const mockedNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

// Importa el componente después de definir los mocks
import Login from '../components/login'

// Helper para renderizar con router y (opcional) estado inicial
function renderWithRouter(ui: React.ReactElement, initialEntries?: any[]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>)
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockedNavigate.mockReset()
  vi.useRealTimers()
})

describe('Login Component', () => {
  it('renderiza campos de email y contraseña', () => {
    renderWithRouter(<Login />)
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('muestra error si se envía sin datos', async () => {
    renderWithRouter(<Login />)
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(screen.getByText(/complete todos los campos/i)).toBeInTheDocument()
  })

  it('muestra "Procesando..." y deshabilita el botón durante la autenticación simulada', async () => {
    renderWithRouter(<Login />)

    await userEvent.type(screen.getByLabelText(/correo/i), 'admin@correo.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), '123456')

    vi.useFakeTimers()
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i })
    await userEvent.click(submitBtn)

    expect(submitBtn).toBeDisabled()
    expect(submitBtn).toHaveTextContent(/procesando/i)

    // avanza el timeout simulado de 1s
    await vi.advanceTimersByTimeAsync(1000)
    vi.useRealTimers()
  })

  it('redirige a UserRedirect con rol administrador y nombre esperado', async () => {
    renderWithRouter(<Login />)

    await userEvent.type(screen.getByLabelText(/correo/i), 'admin@correo.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), '123456')

    vi.useFakeTimers()
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await vi.advanceTimersByTimeAsync(1000)
    vi.useRealTimers()

    const redirect = await screen.findByTestId('user-redirect')
    expect(within(redirect).getByTestId('role')).toHaveTextContent('administrador')
    expect(within(redirect).getByTestId('name')).toHaveTextContent('Admin Principal')
  })

  it('navega a /register al hacer clic en "Registrarse"', async () => {
    renderWithRouter(<Login />)
    const regLink = screen.getByRole('link', { name: /registrarse/i })
    await userEvent.click(regLink)
    expect(mockedNavigate).toHaveBeenCalledWith('/register')
  })

  it('carga simulatedLogin desde location.state (prellena email y password por defecto)', async () => {
    const initialEntries = [
      {
        pathname: '/login',
        state: {
          simulatedLogin: true,
          userEmail: 'doctor@uni.com',
          userType: 'doctor',
          userName: 'Dr. Carlos Mendoza',
          // sin userPassword => el componente pone '123456' por defecto
        },
      },
    ]

    renderWithRouter(<Login />, initialEntries)

    const email = screen.getByLabelText(/correo/i) as HTMLInputElement
    const pass = screen.getByLabelText(/contraseña/i) as HTMLInputElement

    expect(email.value).toBe('doctor@uni.com')
    expect(pass.value).toBe('123456')
  })

  it('asigna rol "inventario" y nombre "María López" si el email contiene "inventario"', async () => {
    renderWithRouter(<Login />)

    await userEvent.type(screen.getByLabelText(/correo/i), 'inventario@site.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'x')

    vi.useFakeTimers()
    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await vi.advanceTimersByTimeAsync(1000)
    vi.useRealTimers()

    const redirect = await screen.findByTestId('user-redirect')
    expect(within(redirect).getByTestId('role')).toHaveTextContent('inventario')
    expect(within(redirect).getByTestId('name')).toHaveTextContent('María López')
  })
})
