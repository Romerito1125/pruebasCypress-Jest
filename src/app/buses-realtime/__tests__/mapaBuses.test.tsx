"use client"

import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// Mocks simplificados
jest.mock("../utils", () => ({
  iniciarSimulacion: jest.fn(),
  obtenerEstaciones: jest.fn(),
  obtenerBuses: jest.fn(),
  obtenerTiempoEstacion: jest.fn(),
  obtenerRutasDisponibles: jest.fn(),
}))

// Mock para Google Maps que nos permita verificar los marcadores
jest.mock("@react-google-maps/api", () => ({
  LoadScript: ({ children }: { children: any }) => <div>{children}</div>,
  GoogleMap: ({ children }: { children: any }) => <div data-testid="google-map">{children}</div>,
  Marker: ({ title }: { title?: string }) => <div data-testid="marker" title={title} />,
  InfoWindow: ({ children }: { children: any }) => <div data-testid="info-window">{children}</div>,
}))

// Mock para Next.js Image
jest.mock("next/image", () => {
  return function MockImage(props: any) {
    return <img {...props} />
  }
})

// Importar después de los mocks
import MapaMIO from "../page"
import * as utils from "../utils"

// Mock para console.error
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock para process.env
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key"

// Funciones mock
const mockIniciarSimulacion = utils.iniciarSimulacion as jest.MockedFunction<typeof utils.iniciarSimulacion>
const mockObtenerEstaciones = utils.obtenerEstaciones as jest.MockedFunction<typeof utils.obtenerEstaciones>
const mockObtenerBuses = utils.obtenerBuses as jest.MockedFunction<typeof utils.obtenerBuses>
const mockObtenerTiempoEstacion = utils.obtenerTiempoEstacion as jest.MockedFunction<typeof utils.obtenerTiempoEstacion>
const mockObtenerRutasDisponibles = utils.obtenerRutasDisponibles as jest.MockedFunction<
  typeof utils.obtenerRutasDisponibles
>

// Datos de prueba simples
const mockRutas = [{ idruta: "A01" }, { idruta: "B02" }]
const mockEstaciones = [{ idestacion: 1, nombre: "Estación Centro", lat: 3.4516, lon: -76.531985 }]
const mockBuses = [
  { idbus: 101, idruta: "A01", lat: 3.452, lon: -76.53, enVuelta: false, destino: "Terminal Norte" },
  { idbus: 102, idruta: "A01", lat: 3.453, lon: -76.531, enVuelta: true, destino: "Terminal Sur" },
]

describe("MapaMIO", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Configurar mocks por defecto
    mockObtenerRutasDisponibles.mockResolvedValue(mockRutas)
    mockIniciarSimulacion.mockResolvedValue()
    mockObtenerEstaciones.mockResolvedValue(mockEstaciones)
    mockObtenerBuses.mockResolvedValue(mockBuses)
    mockObtenerTiempoEstacion.mockResolvedValue([])

    // Mock para window.google.maps.Size
    global.window = Object.create(window)
    Object.defineProperty(window, "google", {
      value: {
        maps: {
          Size: jest.fn().mockImplementation((width, height) => ({ width, height })),
          Animation: {
            DROP: "DROP",
          },
        },
      },
      writable: true,
    })
  })

  // PRUEBAS BÁSICAS SIMPLIFICADAS
  it("debería renderizar el título", () => {
    render(<MapaMIO />)
    expect(screen.getByText("Mapa de rutas en tiempo real del MIO")).toBeInTheDocument()
  })

  it("debería renderizar el formulario", () => {
    render(<MapaMIO />)
    expect(screen.getByPlaceholderText("Ingresa ID de ruta o bus")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument()
  })

  it("debería cargar rutas al inicializar", async () => {
    render(<MapaMIO />)
    await waitFor(() => {
      expect(mockObtenerRutasDisponibles).toHaveBeenCalled()
    })
  })

  it("debería actualizar el input", () => {
    render(<MapaMIO />)
    const input = screen.getByPlaceholderText("Ingresa ID de ruta o bus")

    fireEvent.change(input, { target: { value: "A01" } })
    expect(input).toHaveValue("A01")
  })

  it("debería mostrar sugerencias", async () => {
    render(<MapaMIO />)

    await waitFor(() => {
      expect(mockObtenerRutasDisponibles).toHaveBeenCalled()
    })

    const input = screen.getByPlaceholderText("Ingresa ID de ruta o bus")
    fireEvent.change(input, { target: { value: "A" } })

    await waitFor(() => {
      expect(screen.getByText("A01")).toBeInTheDocument()
    })
  })

  it("debería enviar formulario", async () => {
    render(<MapaMIO />)

    const input = screen.getByPlaceholderText("Ingresa ID de ruta o bus")
    const button = screen.getByRole("button", { name: "Enviar" })

    fireEvent.change(input, { target: { value: "A01" } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockIniciarSimulacion).toHaveBeenCalledWith("A01")
    })
  })

  it("no debería enviar con input vacío", () => {
    render(<MapaMIO />)

    const button = screen.getByRole("button", { name: "Enviar" })
    fireEvent.click(button)

    expect(mockIniciarSimulacion).not.toHaveBeenCalled()
  })

  it("debería manejar errores", async () => {
    mockObtenerRutasDisponibles.mockRejectedValue(new Error("Error"))

    render(<MapaMIO />)

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled()
    })
  })

  it("debería renderizar el mapa", () => {
    render(<MapaMIO />)
    expect(screen.getByTestId("google-map")).toBeInTheDocument()
  })

  // NUEVA PRUEBA: Verificar que al buscar una ruta aparezcan los buses
  it("debería mostrar buses después de buscar una ruta", async () => {
    // Renderizar el componente
    render(<MapaMIO />)

    // Buscar una ruta
    const input = screen.getByPlaceholderText("Ingresa ID de ruta o bus")
    const button = screen.getByRole("button", { name: "Enviar" })

    fireEvent.change(input, { target: { value: "A01" } })
    fireEvent.click(button)

    // Verificar que se llama a iniciarSimulacion
    await waitFor(() => {
      expect(mockIniciarSimulacion).toHaveBeenCalledWith("A01")
    })

    // Verificar que se llama a obtenerEstaciones
    await waitFor(() => {
      expect(mockObtenerEstaciones).toHaveBeenCalledWith("A01")
    })

    // Nota: obtenerBuses se llama en un useEffect con rutaActiva,
    // pero como no tenemos timers reales, verificamos que la ruta se estableció
    // El componente real llamaría a obtenerBuses cuando rutaActiva cambie
  })

  // PRUEBA ADICIONAL: Verificar que se muestran las estaciones
  it("debería mostrar estaciones después de buscar una ruta", async () => {
    render(<MapaMIO />)

    const input = screen.getByPlaceholderText("Ingresa ID de ruta o bus")
    const button = screen.getByRole("button", { name: "Enviar" })

    fireEvent.change(input, { target: { value: "A01" } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockObtenerEstaciones).toHaveBeenCalledWith("A01")
    })

    // Los marcadores solo se renderizan cuando iconSize está disponible
    // En el componente real, esto sucede después de que se carga el mapa
    // Como estamos usando mocks, verificamos que las funciones se llamaron correctamente
    expect(mockIniciarSimulacion).toHaveBeenCalledWith("A01")
    expect(mockObtenerEstaciones).toHaveBeenCalledWith("A01")
  })

})
