import { render, screen, waitFor } from "@testing-library/react"
import CrearNoticiaPage from "../crearNoticia/page"
import { useIsAdmin } from "@/app/hooks/isAdmin"
import { useRouter } from "next/navigation"
import React from "react"

// Mocks necesarios
jest.mock("@/app/hooks/isAdmin", () => ({
  useIsAdmin: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

jest.mock("../../Formularios/CrearNoticiaForm", () => {
  return function MockCrearNoticiaForm() {
    return React.createElement("div", { className: "crear-noticia-form-mock" }, "CrearNoticiaForm")
  }
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseIsAdmin = useIsAdmin as jest.MockedFunction<typeof useIsAdmin>

describe("CrearNoticiaPage", () => {
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
  })

  // 1. PRUEBAS DE USUARIOS ADMIN
  describe("Usuario administrador", () => {
    it("debería mostrar el spinner de carga para usuarios admin", async () => {
      mockUseIsAdmin.mockReturnValue(true)

      render(<CrearNoticiaPage />)

      // Verificar que se muestra el spinner de carga usando la clase CSS
      const spinner = document.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()

      // También verificar el contenedor del spinner
      const loadingContainer = document.querySelector(".flex.justify-center.items-center.h-screen")
      expect(loadingContainer).toBeInTheDocument()
    })
  })

  // 2. PRUEBAS DE USUARIOS NO ADMIN
  describe("Usuario no administrador", () => {
    it("debería mostrar mensaje de acceso restringido para usuarios no admin", async () => {
      mockUseIsAdmin.mockReturnValue(false)

      render(<CrearNoticiaPage />)

      await waitFor(() => {
        expect(screen.getByText("Acceso restringido")).toBeInTheDocument()
        expect(screen.getByText("Solo los administradores pueden crear noticias.")).toBeInTheDocument()
      })
    })

    it("debería navegar al inicio cuando se hace clic en 'Volver al inicio'", async () => {
      mockUseIsAdmin.mockReturnValue(false)

      render(<CrearNoticiaPage />)

      await waitFor(() => {
        const volverButton = screen.getByText("Volver al inicio")
        volverButton.click()
        expect(mockPush).toHaveBeenCalledWith("/")
      })
    })

    it("no debería renderizar el formulario de crear noticia para usuarios no admin", async () => {
      mockUseIsAdmin.mockReturnValue(false)

      render(<CrearNoticiaPage />)

      await waitFor(() => {
        expect(screen.queryByText("CrearNoticiaForm")).not.toBeInTheDocument()
      })
    })

    it("no debería mostrar el spinner para usuarios no admin", async () => {
      mockUseIsAdmin.mockReturnValue(false)

      render(<CrearNoticiaPage />)

      await waitFor(() => {
        const spinner = document.querySelector(".animate-spin")
        expect(spinner).not.toBeInTheDocument()
      })
    })
  })
})
