import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useParams } from "next/navigation"
import AlertaDetalle from "../[idAlerta]/page"
import * as utils from "../../utils"

jest.mock("next/navigation")
jest.mock("../../utils")

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUtils = utils as jest.Mocked<typeof utils>

const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

describe("AlertaDetalle", () => {
  const mockAlerta = {
    idalerta: 1,
    tipo: "Emergencia",
    mensaje: "Alerta de emergencia en la estación central",
    idruta: "R001",
    idestacion: "E001",
    prioridad: "alta",
    hora: "2024-01-15T10:00:00Z",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ idAlerta: "1" })
    mockUtils.obtenerAlertaEspecifica.mockResolvedValue(mockAlerta)
    mockUtils.formatearFechaHora.mockReturnValue("15 de enero de 2024, 10:00:00")
    mockUtils.obtenerEstilosPrioridad.mockReturnValue({
      border: "border-red-500",
      bg: "from-red-50 to-white",
      badge: "bg-red-600",
      icon: "text-red-600",
    })
    mockUtils.validarAlerta.mockReturnValue(true)
    mockUtils.formatearPrioridad.mockReturnValue("Alta")
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it("debe renderizar la alerta correctamente", async () => {
    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByText("Emergencia")).toBeInTheDocument()
      expect(screen.getByText("Alerta de emergencia en la estación central")).toBeInTheDocument()
      expect(screen.getByText("R001")).toBeInTheDocument()
      expect(screen.getByText("E001")).toBeInTheDocument()
      expect(screen.getByText("Prioridad: Alta")).toBeInTheDocument()
      expect(screen.getByText("15 de enero de 2024, 10:00:00")).toBeInTheDocument()
    })

    expect(mockUtils.obtenerAlertaEspecifica).toHaveBeenCalledWith("1")
  })

  it("debe mostrar estado de carga", () => {
    mockUtils.obtenerAlertaEspecifica.mockImplementation(() => new Promise(() => {}))

    render(<AlertaDetalle />)

    expect(screen.getByTestId("loading-state")).toBeInTheDocument()
  })

  it("debe mostrar error cuando falla la carga", async () => {
    mockUtils.obtenerAlertaEspecifica.mockRejectedValue(new Error("Error del servidor"))

    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toBeInTheDocument()
      expect(screen.getByText("Error al cargar la alerta")).toBeInTheDocument()
      expect(screen.getByText("Error del servidor")).toBeInTheDocument()
    })
  })

  it("debe mostrar mensaje cuando no se encuentra la alerta", async () => {
    mockUtils.obtenerAlertaEspecifica.mockResolvedValue(null as any)
    mockUtils.validarAlerta.mockReturnValue(false)

    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("not-found-state")).toBeInTheDocument()
      expect(screen.getByText("Alerta no encontrada")).toBeInTheDocument()
    })
  })

  it("debe manejar ID de alerta inválido", async () => {
    mockUseParams.mockReturnValue({ idAlerta: undefined })

    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toBeInTheDocument()
      expect(screen.getByText("ID de alerta no válido")).toBeInTheDocument()
    })

    expect(mockUtils.obtenerAlertaEspecifica).not.toHaveBeenCalled()
  })

  it("debe aplicar estilos según la prioridad", async () => {
    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("badge-prioridad")).toBeInTheDocument()
    })

    expect(mockUtils.obtenerEstilosPrioridad).toHaveBeenCalledWith("alta")
  })

  it("debe formatear la fecha correctamente", async () => {
    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("alerta-fecha")).toBeInTheDocument()
    })

    expect(mockUtils.formatearFechaHora).toHaveBeenCalledWith("2024-01-15T10:00:00Z")
  })

  it("debe validar la alerta antes de mostrarla", async () => {
    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("alerta-detalle-container")).toBeInTheDocument()
    })

    expect(mockUtils.validarAlerta).toHaveBeenCalledWith(mockAlerta)
  })

  it("debe mostrar botón de volver funcional", async () => {
    const user = userEvent.setup()
    const mockBack = jest.fn()
    Object.defineProperty(window, "history", {
      value: { back: mockBack },
      writable: true,
    })

    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("back-button-header")).toBeInTheDocument()
    })

    const backButton = screen.getByTestId("back-button-header")
    await user.click(backButton)

    expect(mockBack).toHaveBeenCalled()
  })

  it("debe mostrar información de ruta y estación", async () => {
    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("alerta-ruta")).toBeInTheDocument()
      expect(screen.getByTestId("alerta-estacion")).toBeInTheDocument()
    })

    expect(screen.getByTestId("alerta-ruta")).toHaveTextContent("R001")
    expect(screen.getByTestId("alerta-estacion")).toHaveTextContent("E001")
  })

  it("debe mostrar el mensaje de la alerta", async () => {
    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("alerta-mensaje")).toBeInTheDocument()
    })

    expect(screen.getByTestId("alerta-mensaje")).toHaveTextContent("Alerta de emergencia en la estación central")
  })

  it("debe mostrar el tipo de alerta", async () => {
    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("alerta-tipo")).toBeInTheDocument()
    })

    expect(screen.getByTestId("alerta-tipo")).toHaveTextContent("Emergencia")
  })

  it("debe manejar diferentes tipos de prioridad", async () => {
    const alertaMedia = { ...mockAlerta, prioridad: "media" }
    mockUtils.obtenerAlertaEspecifica.mockResolvedValue(alertaMedia)
    mockUtils.obtenerEstilosPrioridad.mockReturnValue({
      border: "border-orange-500",
      bg: "from-orange-50 to-white",
      badge: "bg-orange-500",
      icon: "text-orange-500",
    })
    mockUtils.formatearPrioridad.mockReturnValue("Media")

    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByText("Prioridad: Media")).toBeInTheDocument()
    })

    expect(mockUtils.obtenerEstilosPrioridad).toHaveBeenCalledWith("media")
  })

  it("debe manejar alerta con datos incompletos", async () => {
    const alertaIncompleta = {
      ...mockAlerta,
      mensaje: "",
    }
    mockUtils.obtenerAlertaEspecifica.mockResolvedValue(alertaIncompleta)
    mockUtils.validarAlerta.mockReturnValue(false)

    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByTestId("not-found-state")).toBeInTheDocument()
    })
  })

  it("debe manejar errores de tipo desconocido", async () => {
    mockUtils.obtenerAlertaEspecifica.mockRejectedValue("Error desconocido")

    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(screen.getByText("Error desconocido al cargar la alerta")).toBeInTheDocument()
    })
  })

  it("debe llamar a console.error cuando hay errores", async () => {
    const error = new Error("Error de prueba")
    mockUtils.obtenerAlertaEspecifica.mockRejectedValue(error)

    render(<AlertaDetalle />)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error cargando la alerta:", error)
    })
  })
})
