import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AdminDenuncias } from "../admin-denuncias"
import * as utils from "../utils"
import React from "react"
import toast from "react-hot-toast"

// Mocks necesarios
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  Toaster: () => React.createElement("div", null, "Toaster"),
}))

jest.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => React.createElement("div", props, children) },
}))

// Mock para suprimir console.error en las pruebas
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe("AdminDenuncias", () => {
  // Datos de prueba
  const mockDenuncias = [
    {
      iddenuncia: 1,
      idcuenta: 101,
      mensaje: "Problema con el conductor",
      fecha: "2023-12-01T10:00:00Z",
      estado: "pendiente",
      tipo: "conductor",
      respuesta: null,
    },
    {
      iddenuncia: 2,
      idcuenta: 102,
      mensaje: "Estación sucia",
      fecha: "2023-12-02T11:00:00Z",
      estado: "procesada",
      tipo: "estacion",
      respuesta: "Hemos enviado personal de limpieza",
    },
    {
      iddenuncia: 3,
      idcuenta: 103,
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
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockImplementation(() => new Promise(() => {}))
      render(<AdminDenuncias userId={1} />)
      expect(screen.getByTestId("loading-state")).toBeInTheDocument()
    })

    it("debería cargar y mostrar las denuncias correctamente", async () => {
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(mockDenuncias)
      render(<AdminDenuncias userId={1} />)

      await waitFor(() => {
        expect(screen.getByText(/Panel de Administración/i)).toBeInTheDocument()
        expect(screen.getByText(/Problema con el conductor/i)).toBeInTheDocument()
        expect(screen.getByText(/Estación sucia/i)).toBeInTheDocument()
        expect(screen.getByText(/Servicio lento/i)).toBeInTheDocument()
      })
    })

    it("debería mostrar error y permitir reintentar si falla la carga", async () => {
      const spyObtenerDenuncias = jest
        .spyOn(utils, "obtenerTodasLasDenuncias")
        .mockRejectedValueOnce(new Error("Error del servidor"))
        .mockResolvedValueOnce(mockDenuncias)

      render(<AdminDenuncias userId={1} />)

      await waitFor(() => {
        expect(screen.getByTestId("error-state")).toBeInTheDocument()
        expect(toast.error).toHaveBeenCalledWith("Error al cargar denuncias")
      })

      fireEvent.click(screen.getByTestId("retry-button"))

      await waitFor(() => {
        expect(spyObtenerDenuncias).toHaveBeenCalledTimes(2)
        expect(screen.getByTestId("admin-denuncias-container")).toBeInTheDocument()
      })
    })
  })

  // 2. PRUEBAS DE ESTADÍSTICAS
  describe("Estadísticas", () => {
    it("debería mostrar las estadísticas correctas", async () => {
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(mockDenuncias)
      render(<AdminDenuncias userId={1} />)

      await waitFor(() => {
        expect(screen.getByTestId("stat-total")).toHaveTextContent("3")
        expect(screen.getByTestId("stat-pendientes")).toHaveTextContent("1")
        expect(screen.getByTestId("stat-procesadas")).toHaveTextContent("1")
        expect(screen.getByTestId("stat-cerradas")).toHaveTextContent("1")
      })
    })
  })

  // 3. PRUEBAS DE BÚSQUEDA Y FILTROS
  describe("Búsqueda y filtros", () => {
    it("debería filtrar denuncias por término de búsqueda", async () => {
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(mockDenuncias)
      render(<AdminDenuncias userId={1} />)

      await waitFor(() => {
        expect(screen.getByText(/Problema con el conductor/i)).toBeInTheDocument()
        expect(screen.getByText(/Estación sucia/i)).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "conductor" },
      })

      await waitFor(() => {
        expect(screen.getByText(/Problema con el conductor/i)).toBeInTheDocument()
        expect(screen.queryByText(/Estación sucia/i)).not.toBeInTheDocument()
        expect(screen.getByText(/Se encontraron 1 resultados para "conductor"/i)).toBeInTheDocument()
      })
    })

    it("debería tener filtros de estado y tipo funcionales", async () => {
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(mockDenuncias)
      render(<AdminDenuncias userId={1} />)

      await waitFor(() => {
        expect(screen.getByTestId("status-filter")).toBeInTheDocument()
        expect(screen.getByTestId("type-filter")).toBeInTheDocument()
      })
    })
  })

  // 4. PRUEBAS DE RESPUESTA A DENUNCIAS
  describe("Responder a denuncias", () => {
    it("debería mostrar formulario y enviar respuesta correctamente", async () => {
      const denunciaSinRespuesta = [mockDenuncias[0]]
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(denunciaSinRespuesta)
      const spyResponderDenuncia = jest.spyOn(utils, "responderDenuncia").mockResolvedValue()

      render(<AdminDenuncias userId={1} />)

      await waitFor(() => {
        expect(screen.getByTestId("responder-button-1")).toBeInTheDocument()
      })

      // Abrir formulario
      fireEvent.click(screen.getByTestId("responder-button-1"))
      await waitFor(() => {
        expect(screen.getByTestId("textarea-respuesta-1")).toBeInTheDocument()
      })

      // Verificar botón deshabilitado inicialmente
      const submitButton = screen.getByTestId("submit-respuesta-1")
      expect(submitButton).toBeDisabled()

      // Escribir respuesta y enviar
      fireEvent.change(screen.getByTestId("textarea-respuesta-1"), {
        target: { value: "Respuesta de prueba" },
      })
      expect(submitButton).not.toBeDisabled()
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(spyResponderDenuncia).toHaveBeenCalledWith(1, 101, "Respuesta de prueba")
        expect(toast.success).toHaveBeenCalledWith("Respuesta enviada correctamente")
      })
    })

    it("debería manejar errores al enviar respuesta", async () => {
      const denunciaSinRespuesta = [mockDenuncias[0]]
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(denunciaSinRespuesta)
      jest.spyOn(utils, "responderDenuncia").mockRejectedValue(new Error("Error al enviar respuesta"))

      render(<AdminDenuncias userId={1} />)
      await waitFor(() => expect(screen.getByTestId("responder-button-1")).toBeInTheDocument())

      fireEvent.click(screen.getByTestId("responder-button-1"))
      await waitFor(() => expect(screen.getByTestId("textarea-respuesta-1")).toBeInTheDocument())

      fireEvent.change(screen.getByTestId("textarea-respuesta-1"), {
        target: { value: "Respuesta de prueba" },
      })
      fireEvent.click(screen.getByTestId("submit-respuesta-1"))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al enviar respuesta")
      })
    })

    it("debería cancelar la respuesta correctamente", async () => {
      const denunciaSinRespuesta = [mockDenuncias[0]]
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(denunciaSinRespuesta)

      render(<AdminDenuncias userId={1} />)
      await waitFor(() => expect(screen.getByTestId("responder-button-1")).toBeInTheDocument())

      fireEvent.click(screen.getByTestId("responder-button-1"))
      await waitFor(() => expect(screen.getByTestId("respuesta-form-1")).toBeInTheDocument())

      fireEvent.click(screen.getByTestId("cancel-respuesta-1"))
      await waitFor(() => {
        expect(screen.queryByTestId("respuesta-form-1")).not.toBeInTheDocument()
        expect(screen.getByTestId("responder-button-1")).toBeInTheDocument()
      })
    })

    it("debería validar el comportamiento del botón con diferentes tipos de entrada", async () => {
      const denunciaSinRespuesta = [mockDenuncias[0]]
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(denunciaSinRespuesta)

      render(<AdminDenuncias userId={1} />)
      await waitFor(() => expect(screen.getByTestId("responder-button-1")).toBeInTheDocument())

      fireEvent.click(screen.getByTestId("responder-button-1"))
      await waitFor(() => expect(screen.getByTestId("textarea-respuesta-1")).toBeInTheDocument())

      const submitButton = screen.getByTestId("submit-respuesta-1")
      const textarea = screen.getByTestId("textarea-respuesta-1")

      // Verificar que el botón está deshabilitado inicialmente
      expect(submitButton).toBeDisabled()

      // Escribir solo espacios en blanco
      fireEvent.change(textarea, { target: { value: "   " } })
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })

      // Escribir texto válido
      fireEvent.change(textarea, { target: { value: "Respuesta válida" } })
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })

      // Borrar todo el texto
      fireEvent.change(textarea, { target: { value: "" } })
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })
    })

    it("debería probar la función validarRespuesta directamente", async () => {
      // Probar la función validarRespuesta de forma aislada
      expect(() => utils.validarRespuesta("")).toThrow("Por favor, escribe una respuesta")
      expect(() => utils.validarRespuesta("   ")).toThrow("Por favor, escribe una respuesta")
      expect(() => utils.validarRespuesta("Respuesta válida")).not.toThrow()
    })
  })

  // 5. PRUEBAS DE ACTUALIZACIÓN
  describe("Actualización de denuncias", () => {
    it("debería actualizar las denuncias al hacer clic en el botón de actualizar", async () => {
      const spyObtenerDenuncias = jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(mockDenuncias)
      render(<AdminDenuncias userId={1} />)

      await waitFor(() => expect(screen.getByTestId("refresh-button")).toBeInTheDocument())
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

  // 6. PRUEBAS DE VISUALIZACIÓN DE DENUNCIAS
  describe("Visualización de denuncias", () => {
    it("debería mostrar respuestas existentes y no permitir responder nuevamente", async () => {
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(mockDenuncias)
      render(<AdminDenuncias userId={1} />)

      await waitFor(() => {
        expect(screen.getByTestId("respuesta-existente-2")).toBeInTheDocument()
        expect(screen.getByText(/Hemos enviado personal de limpieza/i)).toBeInTheDocument()
        expect(screen.queryByTestId("responder-button-2")).not.toBeInTheDocument()
      })
    })

    it("debería mostrar mensaje cuando no hay denuncias", async () => {
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue([])
      render(<AdminDenuncias userId={1} />)

      await waitFor(() => {
        expect(screen.getByTestId("no-denuncias-message")).toBeInTheDocument()
        expect(screen.getByText(/No se encontraron denuncias/i)).toBeInTheDocument()
      })
    })
  })

  // 7. PRUEBA DE INTEGRACIÓN: FLUJO COMPLETO
  describe("Flujo completo", () => {
    it("debería completar el flujo de responder una denuncia y actualizar el estado", async () => {
      const denunciaSinRespuesta = [mockDenuncias[0]]
      jest.spyOn(utils, "obtenerTodasLasDenuncias").mockResolvedValue(denunciaSinRespuesta)
      jest.spyOn(utils, "responderDenuncia").mockResolvedValue()

      render(<AdminDenuncias userId={1} />)

      // Verificar estado inicial
      await waitFor(() => {
        expect(screen.getByTestId("badge-estado-1")).toHaveTextContent("Pendiente")
      })

      // Abrir formulario y responder
      fireEvent.click(screen.getByTestId("responder-button-1"))
      fireEvent.change(screen.getByTestId("textarea-respuesta-1"), {
        target: { value: "Problema resuelto satisfactoriamente" },
      })
      fireEvent.click(screen.getByTestId("submit-respuesta-1"))

      // Verificar actualización de estado
      await waitFor(() => {
        expect(screen.getByTestId("badge-estado-1")).toHaveTextContent("Procesada")
        expect(screen.getByTestId("respuesta-existente-1")).toBeInTheDocument()
        expect(screen.getByText(/Problema resuelto satisfactoriamente/i)).toBeInTheDocument()
      })
    })
  })
})
