import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import RecuperarPasswordPage from "../page"
import * as utils from "../utils"
import React from "react"
import toast from "react-hot-toast"

jest.mock("js-cookie", () => ({ get: jest.fn(), set: jest.fn() }))
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => React.createElement("div", null, "Toaster"),
}))

describe("RecuperarPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Fase 1: Envío de OTP", () => {
    it("debe enviar OTP correctamente al correo ingresado", async () => {
      const spySendOtp = jest.spyOn(utils, "enviarOtp").mockResolvedValue({ token: "fake" })

      render(<RecuperarPasswordPage />)

      fireEvent.change(screen.getByPlaceholderText(/correo electrónico/i), {
        target: { value: "usuario@uao.edu.co" },
      })

      fireEvent.click(screen.getByText(/Enviar código OTP/i))

      await waitFor(() => {
        expect(spySendOtp).toHaveBeenCalledWith({
          correo: "usuario@uao.edu.co",
          tipo: "recuperacion",
        })
        expect(toast.success).toHaveBeenCalledWith("Código OTP enviado al correo")
      })
    })
  })

  describe("Fase 2: Verificación del OTP", () => {
    it("debe verificar el código OTP y avanzar al cambio de contraseña", async () => {
      jest.spyOn(utils, "enviarOtp").mockResolvedValue({ token: "fake" })
      const spyVerificarOtp = jest.spyOn(utils, "verificarOtp").mockResolvedValue({ exito: true })

      render(<RecuperarPasswordPage />)

      fireEvent.change(screen.getByPlaceholderText(/correo electrónico/i), {
        target: { value: "usuario@uao.edu.co" },
      })
      fireEvent.click(screen.getByText(/Enviar código OTP/i))

      await waitFor(() => {
        expect(utils.enviarOtp).toHaveBeenCalled()
      })

      fireEvent.change(screen.getByPlaceholderText(/Código OTP/i), {
        target: { value: "123456" },
      })
      fireEvent.click(screen.getByText(/Verificar código/i))

      await waitFor(() => {
        expect(spyVerificarOtp).toHaveBeenCalledWith({
          correo: "usuario@uao.edu.co",
          otp: "123456",
        })
        expect(toast.success).toHaveBeenCalledWith("OTP verificado")
      })
    })
  })

    describe("Fase 3: Cambio de contraseña", () => {
      it("flujo completo: OTP enviado, verificado y contraseña cambiada correctamente", async () => {
        jest.spyOn(utils, "enviarOtp").mockResolvedValue({ token: "fake" })
        jest.spyOn(utils, "verificarOtp").mockResolvedValue({ exito: true })
        const spyCambiarContrasenia = jest
        .spyOn(utils, "resetPassword")
        .mockResolvedValue({ exito: true })

        render(<RecuperarPasswordPage />)

        fireEvent.change(screen.getByPlaceholderText(/correo electrónico/i), {
        target: { value: "usuario@uao.edu.co" },
        })
        fireEvent.click(screen.getByText(/Enviar código OTP/i))
          await waitFor(() => {
          expect(utils.enviarOtp).toHaveBeenCalled()
        })

        fireEvent.change(screen.getByPlaceholderText(/Código OTP/i), {
          target: { value: "123456" },
        })
          fireEvent.click(screen.getByText(/Verificar código/i))

        const nuevaPasswordInput = await screen.findByTestId("inputcito")
        const confirmarPasswordInput = await screen.findByPlaceholderText(/Confirmar nueva contraseña/i)

        const nuevaPassword = "NuevaSegura123*"

        fireEvent.change(nuevaPasswordInput, {
          target: { value: nuevaPassword },
        })

        fireEvent.change(confirmarPasswordInput, {
          target: { value: nuevaPassword },
        })

        const cambiarButton = await screen.findByText(/Cambiar contraseña/i)
        await waitFor(() => {
          expect(cambiarButton).not.toBeDisabled()
        })

        fireEvent.click(cambiarButton)

        await waitFor(() => {
        expect(spyCambiarContrasenia).toHaveBeenCalledWith({
            correo: "usuario@uao.edu.co",
            nuevaContrasenia: nuevaPassword,
        })
          expect(toast.success).toHaveBeenCalledWith("Contraseña restablecida con éxito")
        })
      })
    })
})
// log