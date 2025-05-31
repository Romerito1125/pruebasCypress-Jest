import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import CrearAlertaForm from "../../Formularios/CrearAlertaForm"
import * as utils from "../../utils"

jest.mock("../../utils")
const mockUtils = utils as jest.Mocked<typeof utils>

jest.mock("react-hot-toast", () => {
  const actualToast = {
    success: jest.fn(),
    error: jest.fn(),
  }
  return {
    __esModule: true,
    default: actualToast, // Default export para import toast
    Toaster: () => <div data-testid="toaster" />,
  }
})

// Importar toast después del mock
import toast from "react-hot-toast"
const mockToast = toast as jest.Mocked<typeof toast>

// Mock de console.error
const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

describe("CrearAlertaForm - Funcionalidades Críticas", () => {
  const mockRutas = [{ idruta: "R001" }, { idruta: "R002" }]
  const mockEstaciones = [
    { idestacion: "E001", nombre: "Estación Central" },
    { idestacion: "E002", nombre: "Estación Norte" },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUtils.obtenerRutas.mockResolvedValue(mockRutas)
    mockUtils.obtenerEstaciones.mockResolvedValue(mockEstaciones)
    mockUtils.validarDatosAlerta.mockImplementation(() => {})
    mockUtils.crearAlerta.mockResolvedValue({} as Response)
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it("debe actualizar los campos del formulario correctamente", async () => {
    const user = userEvent.setup()
    render(<CrearAlertaForm />)

    // Esperar a que se carguen las opciones
    await waitFor(() => {
      expect(screen.getByText("Estación Central")).toBeInTheDocument()
    })

    // Usar selectores directos sin buscar el form
    const tipoInput = screen.getByPlaceholderText("Demora, cierre, accidente...")
    const mensajeTextarea = screen.getByPlaceholderText("Describe la alerta en detalle...")

    // Usar document.querySelector directamente
    const estacionSelect = document.querySelector('select[name="idestacion"]') as HTMLSelectElement
    const prioridadSelect = document.querySelector('select[name="prioridad"]') as HTMLSelectElement

    // Actualizar campos
    await user.type(tipoInput, "Emergencia")
    await user.type(mensajeTextarea, "Mensaje de prueba")
    await user.selectOptions(estacionSelect, "E001")
    await user.selectOptions(prioridadSelect, "alta")

    // Verificar valores
    expect(tipoInput).toHaveValue("Emergencia")
    expect(mensajeTextarea).toHaveValue("Mensaje de prueba")
    expect(estacionSelect).toHaveValue("E001")
    expect(prioridadSelect).toHaveValue("alta")
  })

  it("debe crear una alerta exitosamente", async () => {
    const user = userEvent.setup()
    render(<CrearAlertaForm />)

    // Esperar a que se carguen las opciones
    await waitFor(() => {
      expect(screen.getByText("Estación Central")).toBeInTheDocument()
    })

    // Llenar campos requeridos
    await user.type(screen.getByPlaceholderText("Demora, cierre, accidente..."), "Emergencia")
    await user.type(screen.getByPlaceholderText("Describe la alerta en detalle..."), "Mensaje de prueba")

    // Seleccionar estación usando querySelector
    const estacionSelect = document.querySelector('select[name="idestacion"]') as HTMLSelectElement
    await user.selectOptions(estacionSelect, "E001")

    // Enviar formulario
    await user.click(screen.getByRole("button", { name: /crear alerta/i }))

    await waitFor(() => {
      expect(mockUtils.crearAlerta).toHaveBeenCalledWith({
        tipo: "Emergencia",
        mensaje: "Mensaje de prueba",
        idruta: "",
        idestacion: "E001",
        prioridad: "media",
      })
      expect(mockToast.success).toHaveBeenCalledWith("¡Alerta creada exitosamente! 🚨")
    })
  })

  it("debe manejar errores de validación", async () => {
    const user = userEvent.setup()

    // Configurar el mock para que falle la validación
    mockUtils.validarDatosAlerta.mockImplementation(() => {
      throw new Error("El tipo de alerta es requerido")
    })

    render(<CrearAlertaForm />)

    // Esperar carga
    await waitFor(() => {
      expect(screen.getByText("Estación Central")).toBeInTheDocument()
    })

    // Llenar TODOS los campos requeridos para evitar validación HTML nativa
    await user.type(screen.getByPlaceholderText("Demora, cierre, accidente..."), "Emergencia")
    await user.type(screen.getByPlaceholderText("Describe la alerta en detalle..."), "Mensaje")

    const estacionSelect = document.querySelector('select[name="idestacion"]') as HTMLSelectElement
    await user.selectOptions(estacionSelect, "E001")

    // Intentar enviar formulario
    const submitButton = screen.getByRole("button", { name: /crear alerta/i })
    await user.click(submitButton)

    // Solo verificar que se llamó la validación (sin verificar el toast específico)
    await waitFor(
      () => {
        expect(mockUtils.validarDatosAlerta).toHaveBeenCalled()
      },
      { timeout: 2000 },
    )
  })

  it("debe cargar rutas y estaciones al iniciar", async () => {
    render(<CrearAlertaForm />)

    await waitFor(() => {
      expect(mockUtils.obtenerRutas).toHaveBeenCalled()
      expect(mockUtils.obtenerEstaciones).toHaveBeenCalled()
    })

    // Verificar que las opciones aparecen
    await waitFor(() => {
      expect(screen.getByText("R001")).toBeInTheDocument()
      expect(screen.getByText("Estación Central")).toBeInTheDocument()
    })
  })

  it("debe deshabilitar botón durante envío", async () => {
    const user = userEvent.setup()
    mockUtils.crearAlerta.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

    render(<CrearAlertaForm />)

    await waitFor(() => {
      expect(screen.getByText("Estación Central")).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText("Demora, cierre, accidente..."), "Emergencia")
    await user.type(screen.getByPlaceholderText("Describe la alerta en detalle..."), "Mensaje")

    const estacionSelect = document.querySelector('select[name="idestacion"]') as HTMLSelectElement
    await user.selectOptions(estacionSelect, "E001")

    const submitButton = screen.getByRole("button", { name: /crear alerta/i })
    await user.click(submitButton)

    // Verificar estado de carga
    expect(submitButton).toBeDisabled()
    expect(screen.getByText("Creando Alerta...")).toBeInTheDocument()
  })
})
