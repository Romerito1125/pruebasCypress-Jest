import React from "react"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import Cookies from "js-cookie"

// Mock de react-hot-toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
}

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: mockToast,
  success: mockToast.success,
  error: mockToast.error,
  loading: mockToast.loading,
  dismiss: mockToast.dismiss,
  Toaster: ({ children, ...props }: any) => {
    // Filtrar props no válidos para DOM
    const { toastOptions, ...validProps } = props
    return React.createElement("div", { "data-testid": "toaster", ...validProps }, "Toaster")
  },
}))

// Mocks necesarios
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  remove: jest.fn(),
  set: jest.fn(),
}))

jest.mock("jwt-decode", () => ({
  jwtDecode: jest.fn(),
}))

jest.mock("framer-motion", () => ({
  motion: {
    aside: ({ children, initial, animate, transition, ...props }: any) => React.createElement("aside", props, children),
    main: ({ children, initial, animate, transition, ...props }: any) => React.createElement("main", props, children),
    li: ({ children, onClick, whileHover, whileTap, ...props }: any) =>
      React.createElement("li", { onClick, ...props }, children),
    button: ({ children, onClick, whileHover, whileTap, ...props }: any) =>
      React.createElement("button", { onClick, ...props }, children),
  },
}))

// Mock para los componentes de sección
jest.mock("../SeccionCuenta", () => {
  return function MockSeccionCuenta({ correo, id }: { correo: string; id: number }) {
    return React.createElement("div", { "data-testid": "seccion-cuenta" }, `SeccionCuenta - ${correo} - ${id}`)
  }
})

jest.mock("../SeccionPassword", () => {
  return function MockSeccionPassword({ correo }: { correo: string }) {
    return React.createElement("div", { "data-testid": "seccion-password" }, `SeccionPassword - ${correo}`)
  }
})

jest.mock("../SeccionPrivacidad", () => {
  return function MockSeccionPrivacidad({ correo }: { correo: string }) {
    return React.createElement("div", { "data-testid": "seccion-privacidad" }, `SeccionPrivacidad - ${correo}`)
  }
})

// Importar el componente después de los mocks
import CuentaPage from "../page"

// Mock para fetch
global.fetch = jest.fn()

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockCookiesGet = Cookies.get as unknown as jest.MockedFunction<(name: string) => string | undefined>
const mockCookiesRemove = Cookies.remove as unknown as jest.MockedFunction<(name: string) => void>
const mockJwtDecode = jwtDecode as jest.MockedFunction<typeof jwtDecode>

const mockCuentaData = {
  nombre: "Juan",
  apellido: "Pérez",
  correo: "juan@test.com",
}

describe("CuentaPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockToast.success.mockClear()
    mockToast.error.mockClear()
    mockToast.loading.mockClear()
    mockToast.dismiss.mockClear()

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    })

    // Mock fetch por defecto
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCuentaData),
    })
  })

  describe("Autenticación y carga inicial", () => {
    it("debería redirigir al login si no hay token", () => {
      mockCookiesGet.mockReturnValue(undefined)

      render(<CuentaPage />)

      expect(mockPush).toHaveBeenCalledWith("/auth/login")
    })

    it("debería redirigir al login si el token es inválido", () => {
      mockCookiesGet.mockReturnValue("invalid-token")
      mockJwtDecode.mockImplementation(() => {
        throw new Error("Invalid token")
      })

      render(<CuentaPage />)

      expect(mockToast.error).toHaveBeenCalledWith("Token inválido")
      expect(mockPush).toHaveBeenCalledWith("/auth/login")
    })

    it("debería cargar los datos del usuario correctamente", async () => {
      mockCookiesGet.mockReturnValue("valid-token")
      mockJwtDecode.mockReturnValue({
        userId: 123,
        correo: "juan@test.com",
      })

      await act(async () => {
        render(<CuentaPage />)
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("https://www.api.devcorebits.com/cuentasGateway/cuenta/getCuenta/123")
      })

      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
        expect(screen.getByText("juan@test.com")).toBeInTheDocument()
      })
    })

    it("debería mostrar loading inicialmente", () => {
      mockCookiesGet.mockReturnValue("valid-token")
      mockJwtDecode.mockReturnValue({
        userId: 123,
        correo: "juan@test.com",
      })

      render(<CuentaPage />)

      expect(screen.getByText("Cargando")).toBeInTheDocument()
    })

    it("debería manejar errores al cargar la cuenta", async () => {
      mockCookiesGet.mockReturnValue("valid-token")
      mockJwtDecode.mockReturnValue({
        userId: 123,
        correo: "juan@test.com",
      })
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

      await act(async () => {
        render(<CuentaPage />)
      })

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Error cargando cuenta")
      })
    })
  })

  describe("Navegación entre secciones", () => {
    beforeEach(() => {
      mockCookiesGet.mockReturnValue("valid-token")
      mockJwtDecode.mockReturnValue({
        userId: 123,
        correo: "juan@test.com",
      })
    })

    it("debería mostrar la sección de cuenta por defecto", async () => {
      await act(async () => {
        render(<CuentaPage />)
      })

      await waitFor(() => {
        expect(screen.getByTestId("seccion-cuenta")).toBeInTheDocument()
      })

      // Verificar que el título de la página sea "Mi Cuenta" usando un selector más específico
      await waitFor(() => {
        const pageTitle = screen.getByRole("heading", { level: 1 })
        expect(pageTitle).toHaveTextContent("Mi Cuenta")
      })
    })

    it("debería cambiar a la sección de contraseña", async () => {
      await act(async () => {
        render(<CuentaPage />)
      })

      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
      })

      // Buscar todos los elementos de lista y filtrar por el que contiene "Cambiar Contraseña"
      const listItems = screen.getAllByRole("listitem")
      const passwordListItem = listItems.find((item) => item.textContent?.includes("Cambiar Contraseña"))

      expect(passwordListItem).toBeDefined()

      await act(async () => {
        fireEvent.click(passwordListItem!)
      })

      await waitFor(() => {
        expect(screen.getByTestId("seccion-password")).toBeInTheDocument()
      })

      // Verificar que el título de la página cambió
      await waitFor(() => {
        const pageTitle = screen.getByRole("heading", { level: 1 })
        expect(pageTitle).toHaveTextContent("Cambiar Contraseña")
      })
    })

    it("debería cambiar a la sección de privacidad", async () => {
      await act(async () => {
        render(<CuentaPage />)
      })

      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
      })

      // Buscar todos los elementos de lista y filtrar por el que contiene "Privacidad"
      const listItems = screen.getAllByRole("listitem")
      const privacidadListItem = listItems.find((item) => item.textContent?.includes("Privacidad"))

      expect(privacidadListItem).toBeDefined()

      await act(async () => {
        fireEvent.click(privacidadListItem!)
      })

      await waitFor(() => {
        expect(screen.getByTestId("seccion-privacidad")).toBeInTheDocument()
      })

      // Verificar que el título de la página cambió
      await waitFor(() => {
        const pageTitle = screen.getByRole("heading", { level: 1 })
        expect(pageTitle).toHaveTextContent("Privacidad y Seguridad")
      })
    })
  })

  describe("Cerrar sesión", () => {
    beforeEach(() => {
      mockCookiesGet.mockReturnValue("valid-token")
      mockJwtDecode.mockReturnValue({
        userId: 123,
        correo: "juan@test.com",
      })
    })

    it("debería cerrar sesión correctamente", async () => {
      await act(async () => {
        render(<CuentaPage />)
      })

      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
      })

      const logoutButton = screen.getByRole("button", { name: /cerrar sesión/i })
      await act(async () => {
        fireEvent.click(logoutButton)
      })

      expect(mockCookiesRemove).toHaveBeenCalledWith("token")
      expect(mockPush).toHaveBeenCalledWith("/auth/login")
    })
  })

  describe("Interfaz de usuario", () => {
    beforeEach(() => {
      mockCookiesGet.mockReturnValue("valid-token")
      mockJwtDecode.mockReturnValue({
        userId: 123,
        correo: "juan@test.com",
      })
    })

    it("debería mostrar el avatar con iniciales", async () => {
      await act(async () => {
        render(<CuentaPage />)
      })

      await waitFor(() => {
        expect(screen.getByText("JP")).toBeInTheDocument()
      })
    })

    it("debería mostrar todos los elementos del menú", async () => {
      await act(async () => {
        render(<CuentaPage />)
      })

      await waitFor(() => {
        const navElement = screen.getByRole("navigation")
        expect(navElement).toBeInTheDocument()

        // Verificar que los elementos del menú están presentes
        expect(navElement.textContent).toContain("Mi Cuenta")
        expect(navElement.textContent).toContain("Cambiar Contraseña")
        expect(navElement.textContent).toContain("Privacidad")
        expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument()
      })
    })

    it("debería mostrar el toaster", async () => {
      mockCookiesGet.mockReturnValue("valid-token")
      mockJwtDecode.mockReturnValue({
        userId: 123,
        correo: "juan@test.com",
      })

      await act(async () => {
        render(<CuentaPage />)
      })

      // Esperar a que la página cargue completamente antes de buscar el toaster
      await waitFor(() => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
      })

      expect(screen.getByTestId("toaster")).toBeInTheDocument()
    })
  })
})
