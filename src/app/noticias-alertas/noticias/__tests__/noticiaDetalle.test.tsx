import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { useParams, useRouter } from "next/navigation"
import { useIsAdmin } from "../../../hooks/isAdmin"
import * as utils from "../../utils"
import { toast } from "react-hot-toast"
import NoticiaDetalle from "../[idNoticia]/page"

// Mocks necesarios
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}))

jest.mock("../../../hooks/isAdmin", () => ({
  useIsAdmin: jest.fn(),
}))

// Mock para react-hot-toast
jest.mock("react-hot-toast", () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  }
  return {
    __esModule: true,
    default: mockToast,
    toast: mockToast,
  }
})

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement("div", props, children),
    button: ({ children, ...props }: any) => React.createElement("button", props, children),
    a: ({ children, ...props }: any) => React.createElement("a", props, children),
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock para fetch
global.fetch = jest.fn()

// Mock para suprimir console.error en las pruebas
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUseIsAdmin = useIsAdmin as jest.MockedFunction<typeof useIsAdmin>

// Definir el tipo Noticia para que coincida con el componente
type Noticia = {
  idnoticia: number
  titulo: string
  descripcion: string
  link?: string
  autor: string
  fecha: string
}

const mockNoticia: Noticia = {
  idnoticia: 123,
  titulo: "Noticia de prueba",
  descripcion: "Esta es una descripción de prueba para la noticia",
  link: "https://ejemplo.com",
  autor: "Autor de prueba",
  fecha: "2024-01-15T10:30:00Z",
}

describe("NoticiaDetalle", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    })
    mockUseParams.mockReturnValue({ idNoticia: "123" })
    mockUseIsAdmin.mockReturnValue(false)

    // Mock para formatearFecha
    jest.spyOn(utils, "formatearFecha").mockReturnValue("15 de enero de 2024")
  })

  // 1. PRUEBAS DE RENDERIZADO BÁSICO
  describe("Renderizado básico", () => {
    it("debería mostrar spinner de carga inicialmente", () => {
      jest.spyOn(utils, "obtenerNoticiaEspecifica").mockImplementation(() => new Promise(() => {}))

      render(<NoticiaDetalle />)

      expect(screen.getByText("Cargando noticia...")).toBeInTheDocument()
    })

    it("debería renderizar la noticia correctamente", async () => {
      jest.spyOn(utils, "obtenerNoticiaEspecifica").mockResolvedValue(mockNoticia)

      render(<NoticiaDetalle />)

      await waitFor(() => {
        expect(screen.getByText("Noticia de prueba")).toBeInTheDocument()
        expect(screen.getByText("Esta es una descripción de prueba para la noticia")).toBeInTheDocument()
        expect(screen.getByText("Autor de prueba")).toBeInTheDocument()
      })
    })

    it("debería mostrar mensaje de error si no se encuentra la noticia", async () => {
      jest.spyOn(utils, "obtenerNoticiaEspecifica").mockResolvedValue(null as any)

      render(<NoticiaDetalle />)

      await waitFor(() => {
        expect(screen.getByText("No se encontró la noticia.")).toBeInTheDocument()
      })
    })

    it("debería navegar a /noticias al hacer clic en 'Volver a noticias'", async () => {
      jest.spyOn(utils, "obtenerNoticiaEspecifica").mockResolvedValue(mockNoticia)

      render(<NoticiaDetalle />)

      await waitFor(() => {
        const volverButton = screen.getByText("Volver a noticias")
        fireEvent.click(volverButton)
        expect(mockPush).toHaveBeenCalledWith("/noticias")
      })
    })
  })

  // 2. PRUEBAS DE FUNCIONALIDAD ADMIN - SIMPLIFICADAS
  describe("Funcionalidad de administrador", () => {
    it("debería mostrar botones de editar y eliminar para admins", async () => {
      mockUseIsAdmin.mockReturnValue(true)
      jest.spyOn(utils, "obtenerNoticiaEspecifica").mockResolvedValue(mockNoticia)

      render(<NoticiaDetalle />)

      await waitFor(() => {
        // Verificar que los botones de editar y eliminar están presentes
        const editButton = document.querySelector("svg.lucide-square-pen")?.closest("button")
        const deleteButton = document.querySelector("svg.lucide-trash2")?.closest("button")

        expect(editButton).toBeInTheDocument()
        expect(deleteButton).toBeInTheDocument()
      })
    })

    it("no debería mostrar botones de editar y eliminar para usuarios no admin", async () => {
      mockUseIsAdmin.mockReturnValue(false)
      jest.spyOn(utils, "obtenerNoticiaEspecifica").mockResolvedValue(mockNoticia)

      const { container } = render(<NoticiaDetalle />)

      await waitFor(() => {
        // Verificar que los botones no están presentes
        const adminButtons = container.querySelectorAll(".flex.gap-3 button")
        expect(adminButtons.length).toBe(0)
      })
    })
  })

  // 3. PRUEBAS DE MANEJO DE ERRORES
  describe("Manejo de errores", () => {
    it("debería mostrar error si falla la carga de la noticia", async () => {
      jest.spyOn(utils, "obtenerNoticiaEspecifica").mockRejectedValue(new Error("Error de red"))

      render(<NoticiaDetalle />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Error al cargar la noticia")
      })
    })

    it("debería manejar parámetros inválidos", async () => {
      mockUseParams.mockReturnValue({ idNoticia: undefined })

      render(<NoticiaDetalle />)

      await waitFor(() => {
        expect(screen.getByText("No se encontró la noticia.")).toBeInTheDocument()
      })
    })
  })
})
