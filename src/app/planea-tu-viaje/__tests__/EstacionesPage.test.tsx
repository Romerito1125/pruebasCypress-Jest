import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import EstacionesPage from "../page"
import * as utils from "../utils"
import React from "react"
import toast from "react-hot-toast"

// Mock global fetch
global.fetch = jest.fn()

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => React.createElement("div", null, "Toaster"),
}))

// Mock mejorado de framer-motion que ignora las props problemáticas
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }: any) =>
      React.createElement("div", props, children),
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock de datos de prueba
const mockEstaciones = [
  {
    idestacion: 1,
    nombre: "Terminal",
    ubicacion: "Centro de Cali",
    Zona: "0",
  },
  {
    idestacion: 2,
    nombre: "Universidad del Valle",
    ubicacion: "Ciudad Universitaria",
    Zona: "1",
  },
  {
    idestacion: 3,
    nombre: "Menga",
    ubicacion: "Zona Norte",
    Zona: "2",
  },
  {
    idestacion: 4,
    nombre: "Aguablanca",
    ubicacion: "Zona Este",
    Zona: "5",
  },
]

const mockRutaResultado = {
  rutas: ["A01", "B02"],
  transbordo: true,
  estacionTransbordo: 2,
}

// Suprimir todos los console.error durante las pruebas para un output más limpio
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn() // Suprimir todos los console.error durante las pruebas
})

afterAll(() => {
  console.error = originalConsoleError
})

describe("EstacionesPage - Planificador de Rutas", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock fetch para que no falle en el entorno de testing
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockEstaciones,
    })
  })

  // Prueba unitaria - Renderizado inicial
  describe("Renderizado inicial del componente", () => {
    it("debe mostrar el título y elementos principales", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      expect(screen.getByText("Planificador de Rutas")).toBeInTheDocument()
      expect(
        screen.getByText("Selecciona tu estación de origen y destino para calcular la mejor ruta disponible"),
      ).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Buscar estación por nombre o ubicación...")).toBeInTheDocument()
      expect(screen.getByText("Calcular ruta")).toBeInTheDocument()
    })

    it("debe mostrar estado de carga inicial", () => {
      jest.spyOn(utils, "obtenerEstaciones").mockImplementation(() => new Promise(() => {}))

      render(<EstacionesPage />)

      expect(screen.getByText("Cargando estaciones...")).toBeInTheDocument()
      expect(screen.getByText("Esto puede tomar unos momentos")).toBeInTheDocument()
    })
  })

  // Prueba de integración - Carga de estaciones
  describe("Carga de estaciones desde API", () => {
    it("debe cargar y mostrar todas las estaciones correctamente", async () => {
      const spyObtenerEstaciones = jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(spyObtenerEstaciones).toHaveBeenCalledTimes(1)
      })

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
        expect(screen.getByText("Universidad del Valle")).toBeInTheDocument()
        expect(screen.getByText("Menga")).toBeInTheDocument()
        expect(screen.getByText("Aguablanca")).toBeInTheDocument()
      })

      // Verificar que se muestran las zonas
      await waitFor(() => {
        expect(screen.getAllByText("Zona 0 - Centro")).toHaveLength(2) // Aparece en título y en indicador
        expect(screen.getAllByText("Zona 1 - Universidades")).toHaveLength(2)
      })
    })

    it("debe mostrar error cuando falla la carga de estaciones", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockRejectedValue(new Error("Error de red"))

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al cargar las estaciones")
      })
    })
  })

  // Prueba funcional - Selección de origen y destino
  describe("Selección de origen y destino", () => {
    it("debe seleccionar origen en el primer clic", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText("Terminal"))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Origen seleccionado")
      })
    })

    it("debe seleccionar destino en el segundo clic", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      // Seleccionar origen
      fireEvent.click(screen.getByText("Terminal"))
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Origen seleccionado")
      })

      // Seleccionar destino
      fireEvent.click(screen.getByText("Universidad del Valle"))
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Destino seleccionado")
      })
    })

    it("debe deseleccionar origen si se hace clic nuevamente en la misma estación", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      // Seleccionar origen
      fireEvent.click(screen.getByText("Terminal"))
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Origen seleccionado")
      })

      // Deseleccionar origen - usar el primer elemento Terminal (el de la lista de estaciones)
      const terminalElements = screen.getAllByText("Terminal")
      fireEvent.click(terminalElements[1]) // El segundo es el de la lista de estaciones
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Origen deseleccionado")
      })
    })
  })

  // Prueba de integración - Cálculo de rutas
  describe("Cálculo de rutas", () => {
    it("debe calcular ruta exitosamente", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)
      const spyPlanearViaje = jest.spyOn(utils, "planearViaje").mockResolvedValue(mockRutaResultado)
      const spyObtenerNombre = jest.spyOn(utils, "obtenerNombreEstacion").mockResolvedValue("Universidad del Valle")
      const spyObtenerTipo = jest
        .spyOn(utils, "obtenerTipoRuta")
        .mockResolvedValueOnce("troncal")
        .mockResolvedValueOnce("alimentador")

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      // Seleccionar origen y destino
      fireEvent.click(screen.getByText("Terminal"))
      fireEvent.click(screen.getByText("Menga"))

      // Calcular ruta
      const calcularButton = screen.getByText("Calcular ruta")
      fireEvent.click(calcularButton)

      await waitFor(() => {
        expect(spyPlanearViaje).toHaveBeenCalledWith({
          tipo: "viaje_normal",
          origen: 1,
          destino: 3,
        })
        expect(toast.success).toHaveBeenCalledWith("Ruta calculada con éxito")
      })

      // Verificar que se muestra el resultado
      await waitFor(() => {
        expect(screen.getByText("Ruta Recomendada")).toBeInTheDocument()
      })
    })

    it("debe mostrar error si no hay origen y destino seleccionados", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      const calcularButton = screen.getByText("Calcular ruta")
      // Verificar que el botón está deshabilitado cuando no hay selección
      expect(calcularButton).toBeDisabled()
    })

    it("debe mostrar error cuando falla el cálculo de ruta", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)
      const spyPlanearViaje = jest
        .spyOn(utils, "planearViaje")
        .mockRejectedValue(new Error("No se pudo calcular la ruta. Intenta con otras estaciones."))

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      // Seleccionar origen y destino
      fireEvent.click(screen.getByText("Terminal"))
      fireEvent.click(screen.getByText("Menga"))

      const calcularButton = screen.getByText("Calcular ruta")
      fireEvent.click(calcularButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("No se pudo calcular la ruta. Intenta con otras estaciones.")
      })
    })
  })

  // Prueba funcional - Búsqueda de estaciones
  describe("Funcionalidad de búsqueda", () => {
    it("debe filtrar estaciones por nombre", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Buscar estación por nombre o ubicación...")
      fireEvent.change(searchInput, { target: { value: "Terminal" } })

      await waitFor(() => {
        expect(screen.getByText("1 resultados encontrados")).toBeInTheDocument()
      })
    })

    it("debe limpiar búsqueda al hacer clic en X", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText("Buscar estación por nombre o ubicación...")
      fireEvent.change(searchInput, { target: { value: "Terminal" } })

      const clearButton = screen.getByText("✕")
      fireEvent.click(clearButton)

      expect(searchInput).toHaveValue("")
    })
  })

  // Prueba funcional - Reset de selección
  describe("Funcionalidad de reset", () => {
    it("debe reiniciar la selección correctamente", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      // Seleccionar origen y destino
      fireEvent.click(screen.getByText("Terminal"))
      fireEvent.click(screen.getByText("Universidad del Valle"))

      // Reset
      const resetButton = screen.getByText("Reiniciar")
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Selección reiniciada")
      })
    })

    it("debe deshabilitar el botón reset cuando no hay selección", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      const resetButton = screen.getByText("Reiniciar")
      expect(resetButton).toBeDisabled()
    })
  })

  // Prueba funcional - Filtrado por zonas
  describe("Filtrado por zonas", () => {
    it("debe mostrar todas las zonas por defecto", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        expect(screen.getAllByText("Zona 0 - Centro")).toHaveLength(2)
        expect(screen.getAllByText("Zona 1 - Universidades")).toHaveLength(2)
      })
    })

    it("debe mostrar contador de estaciones por zona", async () => {
      jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)

      render(<EstacionesPage />)

      await waitFor(() => {
        // Buscar el texto "estaciones" que aparece en los badges
        expect(screen.getByText(/estaciones/)).toBeInTheDocument()
      })
    })
  })

  // Prueba de integración - Flujo completo
  describe("Flujo completo de planificación", () => {
    it("debe completar el flujo completo: cargar estaciones -> seleccionar origen y destino -> calcular ruta -> mostrar resultado", async () => {
      const spyObtenerEstaciones = jest.spyOn(utils, "obtenerEstaciones").mockResolvedValue(mockEstaciones)
      const spyPlanearViaje = jest.spyOn(utils, "planearViaje").mockResolvedValue({
        rutas: ["A01"],
        transbordo: false,
      })
      const spyObtenerTipo = jest.spyOn(utils, "obtenerTipoRuta").mockResolvedValue("troncal")

      render(<EstacionesPage />)

      // 1. Cargar estaciones
      await waitFor(() => {
        expect(spyObtenerEstaciones).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText("Terminal")).toBeInTheDocument()
      })

      // 2. Seleccionar origen
      fireEvent.click(screen.getByText("Terminal"))
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Origen seleccionado")
      })

      // 3. Seleccionar destino
      fireEvent.click(screen.getByText("Universidad del Valle"))
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Destino seleccionado")
      })

      // 4. Calcular ruta
      const calcularButton = screen.getByText("Calcular ruta")
      fireEvent.click(calcularButton)

      // 5. Verificar resultado
      await waitFor(() => {
        expect(spyPlanearViaje).toHaveBeenCalledWith({
          tipo: "viaje_normal",
          origen: 1,
          destino: 2,
        })
        expect(toast.success).toHaveBeenCalledWith("Ruta calculada con éxito")
        expect(screen.getByText("Ruta Recomendada")).toBeInTheDocument()
      })
    })
  })
})
