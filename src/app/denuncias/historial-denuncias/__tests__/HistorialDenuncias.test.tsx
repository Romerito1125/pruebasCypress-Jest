import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { HistorialDenuncias } from "../historial-denuncias"
import * as utils from "../utils"
import React from "react"
import toast from "react-hot-toast"

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  Toaster: () => React.createElement("div", null, "Toaster"),
}))

jest.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => React.createElement("div", props, children) },
}))

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe("HistorialDenuncias", () => {
  const defaultUserId = 123
  const mockOnCreateClick = jest.fn()

  const mockDenuncias = [
    {
      iddenuncia: 1,
      idcuenta: 123,
      mensaje: "Problema con el conductor",
      fecha: "2023-12-01T10:00:00Z",
      estado: "pendiente",
      tipo: "conductor",
      respuesta: null,
    },
    {
      iddenuncia: 2,
      idcuenta: 123,
      mensaje: "Estación sucia",
      fecha: "2023-12-02T11:00:00Z",
      estado: "procesada",
      tipo: "estacion",
      respuesta: "Hemos enviado personal de limpieza",
    },
    {
      iddenuncia: 3,
      idcuenta: 123,
      mensaje: "Servicio lento",
      fecha: "2023-12-03T12:00:00Z",
      estado: "cerrada",
      tipo: "servicio",
      respuesta: "Problema resuelto",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 1. PRUEBAS DE RENDERIZADO Y CARGA
  describe("Renderizado y carga de datos", () => {
    it("debería mostrar el estado de carga inicialmente", () => {
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockImplementation(() => new Promise(() => {}))
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)
      expect(screen.getByTestId("loading-state")).toBeInTheDocument()
      expect(screen.getByText(/Cargando tus denuncias.../i)).toBeInTheDocument()
    })

    it("debería cargar y mostrar las denuncias correctamente", async () => {
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue(mockDenuncias)
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByTestId("historial-container")).toBeInTheDocument()
        expect(screen.getByText(/Historial de denuncias/i)).toBeInTheDocument()
        expect(screen.getByText(/Problema con el conductor/i)).toBeInTheDocument()
        expect(screen.getByText(/Estación sucia/i)).toBeInTheDocument()
        expect(screen.getByText(/Servicio lento/i)).toBeInTheDocument()
      })
    })

    it("debería mostrar error y permitir reintentar si falla la carga", async () => {
      const spyObtenerDenuncias = jest
        .spyOn(utils, "obtenerDenunciasUsuario")
        .mockRejectedValueOnce(new Error("Error del servidor"))
        .mockResolvedValueOnce(mockDenuncias)

      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toBeInTheDocument()
        expect(screen.getByText(/Error del servidor/i)).toBeInTheDocument()
        expect(toast.error).toHaveBeenCalledWith("Error al cargar denuncias")
      })

      fireEvent.click(screen.getByTestId("retry-button"))

      await waitFor(() => {
        expect(spyObtenerDenuncias).toHaveBeenCalledTimes(2)
        expect(screen.getByTestId("historial-container")).toBeInTheDocument()
      })
    })

    it("debería mostrar estado vacío cuando no hay denuncias", async () => {
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue([])
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByTestId("empty-state")).toBeInTheDocument()
        expect(screen.getByText(/No tienes denuncias/i)).toBeInTheDocument()
        expect(screen.getByTestId("create-button-empty")).toBeInTheDocument()
      })
    })

    it("debería llamar onCreateClick desde el estado vacío", async () => {
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue([])
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByTestId("create-button-empty")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("create-button-empty"))
      expect(mockOnCreateClick).toHaveBeenCalledTimes(1)
    })
  })

  // 2. PRUEBAS DE BÚSQUEDA Y FILTRADO
  describe("Búsqueda y filtrado", () => {
    beforeEach(async () => {
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue(mockDenuncias)
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)
      await waitFor(() => {
        expect(screen.getByTestId("historial-container")).toBeInTheDocument()
      })
    })

    it("debería filtrar denuncias por término de búsqueda", async () => {
      const searchInput = screen.getByTestId("search-input")

      fireEvent.change(searchInput, { target: { value: "conductor" } })

      await waitFor(() => {
        expect(screen.getByTestId("search-results")).toHaveTextContent('Se encontraron 1 resultados para "conductor"')
        expect(screen.getByText(/Problema con el conductor/i)).toBeInTheDocument()
        expect(screen.queryByText(/Estación sucia/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Servicio lento/i)).not.toBeInTheDocument()
      })
    })

    it("debería mostrar mensaje cuando no hay resultados de búsqueda", async () => {
      const searchInput = screen.getByTestId("search-input")

      fireEvent.change(searchInput, { target: { value: "inexistente" } })

      await waitFor(() => {
        expect(screen.getByTestId("no-results")).toBeInTheDocument()
        expect(screen.getByText(/No se encontraron resultados/i)).toBeInTheDocument()
        expect(screen.getByText(/No hay denuncias que coincidan con "inexistente"/i)).toBeInTheDocument()
      })
    })

    it("debería limpiar la búsqueda con el botón de limpiar", async () => {
      const searchInput = screen.getByTestId("search-input") as HTMLInputElement

      fireEvent.change(searchInput, { target: { value: "conductor" } })

      await waitFor(() => {
        expect(screen.getByTestId("clear-search")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("clear-search"))

      await waitFor(() => {
        expect(searchInput.value).toBe("")
        expect(screen.queryByTestId("search-results")).not.toBeInTheDocument()
      })
    })

    it("debería limpiar la búsqueda desde el mensaje de no resultados", async () => {
      const searchInput = screen.getByTestId("search-input") as HTMLInputElement

      fireEvent.change(searchInput, { target: { value: "inexistente" } })

      await waitFor(() => {
        expect(screen.getByTestId("no-results")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/Limpiar búsqueda/i))

      await waitFor(() => {
        expect(searchInput.value).toBe("")
        expect(screen.queryByTestId("no-results")).not.toBeInTheDocument()
      })
    })
  })

  // 3. PRUEBAS DE ACTUALIZACIÓN
  describe("Actualización de denuncias", () => {
    it("debería actualizar las denuncias al hacer clic en el botón de actualizar", async () => {
      const spyObtenerDenuncias = jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue(mockDenuncias)
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByTestId("refresh-button")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("refresh-button"))

      await waitFor(() => {
        expect(spyObtenerDenuncias).toHaveBeenCalledTimes(2)
      })

      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith("Denuncias actualizadas")
        },
        { timeout: 1000 },
      )
    })
  })

  // 4. PRUEBAS DE ELIMINACIÓN
  describe("Eliminación de denuncias", () => {
    beforeEach(async () => {
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue(mockDenuncias)
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)
      await waitFor(() => {
        expect(screen.getByTestId("historial-container")).toBeInTheDocument()
      })
    })

    it("debería abrir el diálogo de confirmación al hacer clic en eliminar", async () => {
      const deleteButton = screen.getByTestId("delete-button-1")
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/¿Estás seguro?/i)).toBeInTheDocument()
        expect(screen.getByText(/Esta acción no se puede deshacer/i)).toBeInTheDocument()
        expect(screen.getByTestId("cancel-delete-1")).toBeInTheDocument()
        expect(screen.getByTestId("confirm-delete-1")).toBeInTheDocument()
      })
    })

    it("debería cancelar la eliminación", async () => {
      const deleteButton = screen.getByTestId("delete-button-1")
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByTestId("cancel-delete-1")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("cancel-delete-1"))

      await waitFor(() => {
        expect(screen.queryByText(/¿Estás seguro?/i)).not.toBeInTheDocument()
      })
    })

    it("debería eliminar la denuncia correctamente", async () => {
      const spyEliminarDenuncia = jest.spyOn(utils, "eliminarDenuncia").mockResolvedValue()

      const deleteButton = screen.getByTestId("delete-button-1")
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByTestId("confirm-delete-1")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("confirm-delete-1"))

      await waitFor(() => {
        expect(spyEliminarDenuncia).toHaveBeenCalledWith(1)
        expect(toast.success).toHaveBeenCalledWith("La denuncia ha sido eliminada correctamente")
        expect(screen.queryByTestId("denuncia-card-1")).not.toBeInTheDocument()
      })
    })

    it("debería manejar errores al eliminar", async () => {
      jest.spyOn(utils, "eliminarDenuncia").mockRejectedValue(new Error("Error al eliminar"))

      const deleteButton = screen.getByTestId("delete-button-1")
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByTestId("confirm-delete-1")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("confirm-delete-1"))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al eliminar")
        expect(screen.getByTestId("denuncia-card-1")).toBeInTheDocument() // La denuncia sigue ahí
      })
    })

    it("debería mostrar estado de carga durante la eliminación", async () => {
      let resolvePromise: () => void
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })
      jest.spyOn(utils, "eliminarDenuncia").mockReturnValue(promise)

      const deleteButton = screen.getByTestId("delete-button-1")
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByTestId("confirm-delete-1")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("confirm-delete-1"))

      await waitFor(() => {
        expect(screen.getByText(/Eliminando.../i)).toBeInTheDocument()
        expect(screen.getByTestId("delete-button-1")).toBeDisabled()
      })

      resolvePromise!()

      await waitFor(() => {
        expect(screen.queryByText(/Eliminando.../i)).not.toBeInTheDocument()
      })
    })
  })

  // 5. PRUEBAS DE NAVEGACIÓN
  describe("Navegación", () => {
    it("debería llamar onCreateClick desde el botón de nueva denuncia", async () => {
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue(mockDenuncias)
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByTestId("create-button")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("create-button"))
      expect(mockOnCreateClick).toHaveBeenCalledTimes(1)
    })
  })

  // 6. PRUEBAS DE VISUALIZACIÓN DE DENUNCIAS
  describe("Visualización de denuncias", () => {
    beforeEach(async () => {
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue(mockDenuncias)
      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)
      await waitFor(() => {
        expect(screen.getByTestId("historial-container")).toBeInTheDocument()
      })
    })

    it("debería mostrar todas las denuncias con sus datos correctos", () => {
      // Verificar que se muestran todas las denuncias
      expect(screen.getByTestId("denuncia-card-1")).toBeInTheDocument()
      expect(screen.getByTestId("denuncia-card-2")).toBeInTheDocument()
      expect(screen.getByTestId("denuncia-card-3")).toBeInTheDocument()

      // Verificar contenido de las denuncias
      expect(screen.getByText(/Problema con el conductor/i)).toBeInTheDocument()
      expect(screen.getByText(/Estación sucia/i)).toBeInTheDocument()
      expect(screen.getByText(/Servicio lento/i)).toBeInTheDocument()
    })

    it("debería mostrar los estados correctos de las denuncias", () => {
      expect(screen.getByTestId("badge-estado-1")).toHaveTextContent("Pendiente")
      expect(screen.getByTestId("badge-estado-2")).toHaveTextContent("Procesada")
      expect(screen.getByTestId("badge-estado-3")).toHaveTextContent("Cerrada")
    })

    it("debería mostrar respuestas cuando existen", () => {
      expect(screen.getByTestId("respuesta-2")).toBeInTheDocument()
      expect(screen.getByText(/Hemos enviado personal de limpieza/i)).toBeInTheDocument()
      expect(screen.getByTestId("respuesta-3")).toBeInTheDocument()
      expect(screen.getByText(/Problema resuelto/i)).toBeInTheDocument()
    })

    it("debería no mostrar respuesta cuando no existe", () => {
      expect(screen.queryByTestId("respuesta-1")).not.toBeInTheDocument()
    })
  })

  // 7. PRUEBAS DE FUNCIONES UTILITARIAS
  describe("Funciones utilitarias", () => {
    it("debería probar las funciones utilitarias directamente", () => {
      // Probar formatearFecha
      const fecha = utils.formatearFecha("2023-12-01T10:00:00Z")
      expect(fecha).toContain("2023")

      // Probar obtenerColorEstado
      expect(utils.obtenerColorEstado("pendiente")).toContain("yellow")
      expect(utils.obtenerColorEstado("procesada")).toContain("blue")
      expect(utils.obtenerColorEstado("cerrada")).toContain("green")

      // Probar obtenerEtiquetaTipo
      expect(utils.obtenerEtiquetaTipo("conductor")).toBe("Conductor")
      expect(utils.obtenerEtiquetaTipo("estacion")).toBe("Estación")
      expect(utils.obtenerEtiquetaTipo("servicio")).toBe("Servicio")

      // Probar filtrarDenuncias
      const filtradas = utils.filtrarDenuncias(mockDenuncias, "conductor")
      expect(filtradas).toHaveLength(1)
      expect(filtradas[0].tipo).toBe("conductor")
    })
  })

  // 8. PRUEBA DE INTEGRACIÓN: FLUJO COMPLETO
  describe("Flujo completo", () => {
    it("debería completar el flujo de buscar y eliminar una denuncia", async () => {
      const spyEliminarDenuncia = jest.spyOn(utils, "eliminarDenuncia").mockResolvedValue()
      jest.spyOn(utils, "obtenerDenunciasUsuario").mockResolvedValue(mockDenuncias)

      render(<HistorialDenuncias userId={defaultUserId} onCreateClick={mockOnCreateClick} />)

      // 1. Esperar a que carguen las denuncias
      await waitFor(() => {
        expect(screen.getByTestId("historial-container")).toBeInTheDocument()
      })

      // 2. Buscar una denuncia específica
      const searchInput = screen.getByTestId("search-input")
      fireEvent.change(searchInput, { target: { value: "conductor" } })

      await waitFor(() => {
        expect(screen.getByTestId("search-results")).toHaveTextContent('Se encontraron 1 resultados para "conductor"')
      })

      // 3. Eliminar la denuncia encontrada
      fireEvent.click(screen.getByTestId("delete-button-1"))

      await waitFor(() => {
        expect(screen.getByTestId("confirm-delete-1")).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId("confirm-delete-1"))

      // 4. Verificar que se eliminó correctamente
      await waitFor(() => {
        expect(spyEliminarDenuncia).toHaveBeenCalledWith(1)
        expect(toast.success).toHaveBeenCalledWith("La denuncia ha sido eliminada correctamente")
        expect(screen.queryByTestId("denuncia-card-1")).not.toBeInTheDocument()
      })

      // 5. Verificar que la búsqueda se actualiza
      await waitFor(() => {
        expect(screen.getByTestId("search-results")).toHaveTextContent('Se encontraron 0 resultados para "conductor"')
      })
    })
  })
})
