import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import BusesPorEstacion from "../page"
import * as utils from "../utils"

// Mocks necesarios
jest.mock("../utils", () => ({
  obtenerLlegadasGenerales: jest.fn(),
}))

// Mock para suprimir console.error en las pruebas
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Mock para setInterval y clearInterval
jest.useFakeTimers()

const mockObtenerLlegadasGenerales = utils.obtenerLlegadasGenerales as jest.MockedFunction<
  typeof utils.obtenerLlegadasGenerales
>

// Datos de prueba
const mockEstacionesConBuses: utils.EstacionConBuses[] = [
  {
    idestacion: 1,
    nombre: "Estación Central",
    buses: [
      {
        idbus: 101,
        ruta: "A1",
        tiempo_estimado_min: 5,
      },
      {
        idbus: 102,
        ruta: "B2",
        tiempo_estimado_min: 0,
      },
    ],
  },
  {
    idestacion: 2,
    nombre: "Estación Norte",
    buses: [
      {
        idbus: 201,
        ruta: "C3",
        tiempo_estimado_min: 10,
      },
    ],
  },
  {
    idestacion: 3,
    nombre: "Estación Sur",
    buses: [],
  },
]

const mockEstacionesSinBuses: utils.EstacionConBuses[] = [
  {
    idestacion: 1,
    nombre: "Estación Vacía",
    buses: [],
  },
]

describe("BusesPorEstacion", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    mockObtenerLlegadasGenerales.mockResolvedValue(mockEstacionesConBuses)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  // 1. PRUEBAS DE RENDERIZADO BÁSICO
  describe("Renderizado básico", () => {
    it("debería mostrar el título y descripción", () => {
      render(<BusesPorEstacion />)

      expect(screen.getByText("🚏 Buses por Estación")).toBeInTheDocument()
      expect(screen.getByText("Información del tiempo de llegada de los buses")).toBeInTheDocument()
    })

    it("debería mostrar el campo de búsqueda", () => {
      render(<BusesPorEstacion />)

      expect(screen.getByPlaceholderText("Buscar estación...")).toBeInTheDocument()
    })

    it("debería mostrar skeleton loading inicialmente", () => {
      render(<BusesPorEstacion />)

      // Verificar que se muestran los skeletons de carga
      const skeletons = document.querySelectorAll(".animate-pulse")
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  // 2. PRUEBAS DE CARGA DE DATOS
  describe("Carga de datos", () => {
    it("debería cargar y mostrar las estaciones correctamente", async () => {
      render(<BusesPorEstacion />)

      await waitFor(() => {
        expect(screen.getByText("Estación Central")).toBeInTheDocument()
        expect(screen.getByText("Estación Norte")).toBeInTheDocument()
        expect(screen.getByText("Estación Sur")).toBeInTheDocument()
      })

      expect(mockObtenerLlegadasGenerales).toHaveBeenCalledTimes(1)
    })

    it("debería mostrar información de buses correctamente", async () => {
      render(<BusesPorEstacion />)

      await waitFor(() => {
        // Verificar buses de Estación Central
        expect(screen.getByText("101")).toBeInTheDocument()
        expect(screen.getByText("Ruta A1")).toBeInTheDocument()
        expect(screen.getByText("5 min")).toBeInTheDocument()

        expect(screen.getByText("102")).toBeInTheDocument()
        expect(screen.getByText("Ruta B2")).toBeInTheDocument()
        expect(screen.getByText("Llegó")).toBeInTheDocument()
      })
    })

    it("debería mostrar mensaje cuando no hay buses", async () => {
      render(<BusesPorEstacion />)

      await waitFor(() => {
        expect(screen.getByText("Sin buses próximos")).toBeInTheDocument()
      })
    })

    it("debería manejar errores en la carga de datos", async () => {
      mockObtenerLlegadasGenerales.mockRejectedValue(new Error("Error de red"))

      render(<BusesPorEstacion />)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Error al obtener llegadas generales", expect.any(Error))
      })
    })
  })

  // 3. PRUEBAS DE FUNCIONALIDAD DE BÚSQUEDA
  describe("Funcionalidad de búsqueda", () => {
    it("debería filtrar estaciones por nombre", async () => {
      render(<BusesPorEstacion />)

      // Esperar a que carguen los datos
      await waitFor(() => {
        expect(screen.getByText("Estación Central")).toBeInTheDocument()
      })

      // Buscar "Central"
      const searchInput = screen.getByPlaceholderText("Buscar estación...")
      fireEvent.change(searchInput, { target: { value: "Central" } })

      // Solo debería mostrar Estación Central
      expect(screen.getByText("Estación Central")).toBeInTheDocument()
      expect(screen.queryByText("Estación Norte")).not.toBeInTheDocument()
      expect(screen.queryByText("Estación Sur")).not.toBeInTheDocument()
    })

    it("debería mostrar botón de limpiar búsqueda cuando hay texto", async () => {
      render(<BusesPorEstacion />)

      const searchInput = screen.getByPlaceholderText("Buscar estación...")
      fireEvent.change(searchInput, { target: { value: "test" } })

      // Verificar que aparece el botón de limpiar (X)
      const clearButton = document.querySelector('button[class*="text-blue-400"]')
      expect(clearButton).toBeInTheDocument()
    })

    it("debería limpiar la búsqueda al hacer clic en el botón X", async () => {
      render(<BusesPorEstacion />)

      const searchInput = screen.getByPlaceholderText("Buscar estación...")
      fireEvent.change(searchInput, { target: { value: "test" } })

      const clearButton = document.querySelector('button[class*="text-blue-400"]')
      fireEvent.click(clearButton!)

      expect(searchInput).toHaveValue("")
    })

    it("debería mostrar mensaje cuando no hay coincidencias", async () => {
      render(<BusesPorEstacion />)

      // Esperar a que carguen los datos
      await waitFor(() => {
        expect(screen.getByText("Estación Central")).toBeInTheDocument()
      })

      // Buscar algo que no existe
      const searchInput = screen.getByPlaceholderText("Buscar estación...")
      fireEvent.change(searchInput, { target: { value: "NoExiste" } })

      expect(screen.getByText('No se encontraron coincidencias para "NoExiste"')).toBeInTheDocument()
      expect(screen.getByText("Mostrar todas las estaciones")).toBeInTheDocument()
    })

    it("debería mostrar todas las estaciones al hacer clic en 'Mostrar todas'", async () => {
      render(<BusesPorEstacion />)

      // Esperar a que carguen los datos
      await waitFor(() => {
        expect(screen.getByText("Estación Central")).toBeInTheDocument()
      })

      // Buscar algo que no existe
      const searchInput = screen.getByPlaceholderText("Buscar estación...")
      fireEvent.change(searchInput, { target: { value: "NoExiste" } })

      // Hacer clic en mostrar todas
      const showAllButton = screen.getByText("Mostrar todas las estaciones")
      fireEvent.click(showAllButton)

      expect(searchInput).toHaveValue("")
      expect(screen.getByText("Estación Central")).toBeInTheDocument()
      expect(screen.getByText("Estación Norte")).toBeInTheDocument()
    })

    it("debería filtrar de manera case-insensitive", async () => {
      render(<BusesPorEstacion />)

      // Esperar a que carguen los datos
      await waitFor(() => {
        expect(screen.getByText("Estación Central")).toBeInTheDocument()
      })

      // Buscar en minúsculas
      const searchInput = screen.getByPlaceholderText("Buscar estación...")
      fireEvent.change(searchInput, { target: { value: "central" } })

      expect(screen.getByText("Estación Central")).toBeInTheDocument()
      expect(screen.queryByText("Estación Norte")).not.toBeInTheDocument()
    })
  })

  // 4. PRUEBAS DE ACTUALIZACIÓN AUTOMÁTICA
  describe("Actualización automática", () => {
    it("debería configurar interval para actualizar cada 10 segundos", async () => {
      render(<BusesPorEstacion />)

      // Verificar que se llama inicialmente
      expect(mockObtenerLlegadasGenerales).toHaveBeenCalledTimes(1)

      // Avanzar 10 segundos
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      // Debería llamarse nuevamente
      expect(mockObtenerLlegadasGenerales).toHaveBeenCalledTimes(2)

      // Avanzar otros 10 segundos
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(mockObtenerLlegadasGenerales).toHaveBeenCalledTimes(3)
    })

    it("debería limpiar el interval al desmontar el componente", () => {
      const { unmount } = render(<BusesPorEstacion />)

      // Verificar que hay un timer activo
      expect(jest.getTimerCount()).toBe(1)

      // Desmontar componente
      unmount()

      // El timer debería haberse limpiado
      expect(jest.getTimerCount()).toBe(0)
    })
  })

  // 5. PRUEBAS DE ESTADOS VISUALES
  describe("Estados visuales", () => {
    it("debería mostrar diferentes colores según tiempo de llegada", async () => {
      render(<BusesPorEstacion />)

      await waitFor(() => {
        // Bus que llegó (tiempo = 0) - verde
        const llegadaElement = screen.getByText("Llegó").closest("div")
        expect(llegadaElement).toHaveClass("text-green-600")

        // Bus con tiempo <= 5 min - naranja
        const cincoMinElement = screen.getByText("5 min").closest("div")
        expect(cincoMinElement).toHaveClass("text-orange-500")

        // Bus con tiempo > 5 min - azul
        const diezMinElement = screen.getByText("10 min").closest("div")
        expect(diezMinElement).toHaveClass("text-blue-600")
      })
    })

    it("debería mostrar el loading state correctamente", () => {
      // Mock para que la promesa no se resuelva inmediatamente
      mockObtenerLlegadasGenerales.mockImplementation(() => new Promise(() => {}))

      render(<BusesPorEstacion />)

      // Verificar que se muestran los skeletons
      const skeletons = document.querySelectorAll(".animate-pulse")
      expect(skeletons.length).toBeGreaterThan(0)

      // Verificar que no se muestran las estaciones reales
      expect(screen.queryByText("Estación Central")).not.toBeInTheDocument()
    })
  })
})
