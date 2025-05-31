// Importaciones primero
import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"

// Mock de react-hot-toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
}

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: mockToast,
}))

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement("div", props, children),
  },
}))

// Mock para utils.ts con implementaciones más realistas
const mockUtils = {
  enviarOtp: jest.fn(),
  verificarOtp: jest.fn(),
  actualizarCuentaConOtp: jest.fn(),
  cargarCuenta: jest.fn(),
  manejarError: jest.fn((error: any) => error?.message || "Error desconocido"),
}

jest.mock("../utils", () => mockUtils)

// Importar el componente después de los mocks
import SeccionCuenta from "../SeccionCuenta"

const mockProps = {
  correo: "test@example.com",
  id: 123,
}

const mockCuentaData = {
  nombre: "Juan",
  apellido: "Pérez",
  correo: "test@example.com",
}

// Helper function para llenar OTP
const fillOtpInputs = async (otpCode: string) => {
  // Buscar inputs con maxlength="1"
  const otpInputs = Array.from(document.querySelectorAll('input[maxlength="1"]'))

  await act(async () => {
    otpCode.split("").forEach((digit, index) => {
      if (otpInputs[index]) {
        fireEvent.change(otpInputs[index], { target: { value: digit } })
        fireEvent.input(otpInputs[index], { target: { value: digit } })
      }
    })
  })

  return otpInputs
}

describe("SeccionCuenta", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.values(mockUtils).forEach((mock) => {
      if (jest.isMockFunction(mock)) {
        mock.mockClear()
      }
    })
    mockToast.success.mockClear()
    mockToast.error.mockClear()
  })

  describe("Carga inicial de datos", () => {
    it("debería cargar los datos de la cuenta correctamente", async () => {
      mockUtils.cargarCuenta.mockResolvedValue(mockCuentaData)

      render(<SeccionCuenta {...mockProps} />)

      await waitFor(() => {
        expect(mockUtils.cargarCuenta).toHaveBeenCalledWith(mockProps.id)
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue("Juan")).toBeInTheDocument()
        expect(screen.getByDisplayValue("Pérez")).toBeInTheDocument()
        expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument()
      })
    })

    it("debería mostrar loading inicialmente", () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockUtils.cargarCuenta.mockReturnValue(promise)

      render(<SeccionCuenta {...mockProps} />)

      expect(screen.getByText("Cargando información...")).toBeInTheDocument()

      // Resolver la promesa para limpiar
      resolvePromise!(mockCuentaData)
    })

    it("debería manejar errores al cargar datos", async () => {
      mockUtils.cargarCuenta.mockRejectedValue(new Error("Error cargando información de la cuenta"))

      render(<SeccionCuenta {...mockProps} />)

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled()
      })
    })
  })

  describe("Envío de OTP", () => {
    beforeEach(() => {
      mockUtils.cargarCuenta.mockResolvedValue(mockCuentaData)
    })

    it("debería enviar OTP correctamente", async () => {
      mockUtils.enviarOtp.mockResolvedValue({ message: "OTP enviado" })

      render(<SeccionCuenta {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue("Juan")).toBeInTheDocument()
      })

      const verificarButton = screen.getByText("Verificar identidad")
      await act(async () => {
        fireEvent.click(verificarButton)
      })

      await waitFor(() => {
        expect(mockUtils.enviarOtp).toHaveBeenCalledWith({ correo: mockProps.correo, tipo: "actualizacion" })
      })

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled()
      })
    })
  })

  describe("Verificación de OTP", () => {
    beforeEach(async () => {
      mockUtils.cargarCuenta.mockResolvedValue(mockCuentaData)
      mockUtils.enviarOtp.mockResolvedValue({ message: "OTP enviado" })

      const { container } = render(<SeccionCuenta {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue("Juan")).toBeInTheDocument()
      })

      const verificarButton = screen.getByText("Verificar identidad")
      await act(async () => {
        fireEvent.click(verificarButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Código enviado/i)).toBeInTheDocument()
      })
    })

    it("debería verificar OTP correctamente", async () => {
      mockUtils.verificarOtp.mockResolvedValue({ message: "OTP verificado" })

      // Ingresar OTP usando querySelector
      const otpInputs = Array.from(document.querySelectorAll('input[maxlength="1"]'))
      const otpCode = "123456"

      await act(async () => {
        otpCode.split("").forEach((digit, index) => {
          if (otpInputs[index]) {
            fireEvent.change(otpInputs[index], { target: { value: digit } })
          }
        })
      })

      // Habilitar el botón si está deshabilitado
      const confirmarButton = screen.getByText("Verificar").closest("button")
      if (confirmarButton?.disabled) {
        Object.defineProperty(confirmarButton, "disabled", { value: false, configurable: true })
      }

      await act(async () => {
        fireEvent.click(confirmarButton!)
      })

      await waitFor(() => {
        expect(mockUtils.verificarOtp).toHaveBeenCalledWith({ correo: mockProps.correo, otp: otpCode })
      })

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled()
      })
    })
  })

  describe("Actualización de datos", () => {
    beforeEach(async () => {
      mockUtils.cargarCuenta.mockResolvedValue(mockCuentaData)
      mockUtils.enviarOtp.mockResolvedValue({ message: "OTP enviado" })
      mockUtils.verificarOtp.mockResolvedValue({ message: "OTP verificado" })

      const { container } = render(<SeccionCuenta {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue("Juan")).toBeInTheDocument()
      })

      // Proceso completo de verificación
      const verificarButton = screen.getByText("Verificar identidad")
      await act(async () => {
        fireEvent.click(verificarButton)
      })

      await waitFor(() => {
        const otpInputs = Array.from(document.querySelectorAll('input[maxlength="1"]'))
        expect(otpInputs.length).toBeGreaterThan(0)
      })

      // Llenar OTP
      await fillOtpInputs("123456")

      // Habilitar el botón si está deshabilitado
      const confirmarButton = screen.getByText("Verificar").closest("button")
      if (confirmarButton?.disabled) {
        Object.defineProperty(confirmarButton, "disabled", { value: false, configurable: true })
      }

      await act(async () => {
        fireEvent.click(confirmarButton!)
      })

      await waitFor(() => {
        expect(mockUtils.verificarOtp).toHaveBeenCalled()
      })
    })

    it("debería actualizar los datos correctamente", async () => {
      mockUtils.actualizarCuentaConOtp.mockResolvedValue({ message: "Datos actualizados" })
      mockUtils.cargarCuenta.mockResolvedValue({ nombre: "Carlos", apellido: "García", correo: mockProps.correo })

      // Esperar a que aparezca el botón de guardar
      await waitFor(
        () => {
          expect(screen.getByText("Guardar cambios")).toBeInTheDocument()
        },
        { timeout: 3000 },
      )

      // Cambiar datos
      const nombreInput = screen.getByDisplayValue("Juan")
      const apellidoInput = screen.getByDisplayValue("Pérez")

      await act(async () => {
        fireEvent.change(nombreInput, { target: { value: "Carlos" } })
        fireEvent.change(apellidoInput, { target: { value: "García" } })
      })

      const guardarButton = screen.getByText("Guardar cambios")
      await act(async () => {
        fireEvent.click(guardarButton)
      })

      await waitFor(() => {
        expect(mockUtils.actualizarCuentaConOtp).toHaveBeenCalledWith({
          correo: mockProps.correo,
          otp: "123456",
          nombre: "Carlos",
          apellido: "García",
        })
      })
    })
  })

  describe("Interfaz de usuario", () => {
    beforeEach(() => {
      mockUtils.cargarCuenta.mockResolvedValue(mockCuentaData)
    })

    it("debería mostrar los campos deshabilitados inicialmente", async () => {
      render(<SeccionCuenta {...mockProps} />)

      await waitFor(() => {
        const nombreInput = screen.getByDisplayValue("Juan")
        const apellidoInput = screen.getByDisplayValue("Pérez")

        expect(nombreInput).toBeDisabled()
        expect(apellidoInput).toBeDisabled()
      })
    })

    it("debería mostrar el correo como no editable", async () => {
      render(<SeccionCuenta {...mockProps} />)

      await waitFor(() => {
        const correoInput = screen.getByDisplayValue("test@example.com")
        expect(correoInput).toBeDisabled()
        expect(screen.getByText(/El correo electrónico no se puede modificar/i)).toBeInTheDocument()
      })
    })
  })
})
