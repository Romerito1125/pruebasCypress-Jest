import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import RegisterPage from "../page"
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

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  //Prueba de integración - Registro correctamente
    describe("Registro Exitoso", () => {
        it("Muestra mensaje de bienvenida", async () => {
        const spyRegister = jest.spyOn(utils, "registerUsuario").mockResolvedValue({ token: "fake" })

        render(<RegisterPage />)

        fireEvent.change(screen.getByPlaceholderText(/Nombre/i), {
            target: { value: "Jean Paul" },
        })
        fireEvent.change(screen.getByPlaceholderText(/Apellido/i), {
            target: { value: "Delgado" },
        })
        fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), {
            target: { value: "jean.delgado@uao.edu.co" },
        })
        fireEvent.change(screen.getByPlaceholderText(/Mínimo 8 caracteres/i), {
            target: { value: "JDelgado*123" },
        })
        fireEvent.click(screen.getByText("Crear cuenta"))

        await waitFor(() => {
            expect(spyRegister).toHaveBeenCalledWith({
                nombre: "Jean Paul",
                apellido: "Delgado",    
                correo: "jean.delgado@uao.edu.co",
                contrasenia: "JDelgado*123",
            })
        })
            expect(toast.success).toHaveBeenCalledWith("¡Registro exitoso!")
        })
    })

    //Prueba unitaria - Ojito
    describe("Descubrir contraseña", () => {
    it("Se descubre la contraseña al darle al ojito", async () => {
        render(<RegisterPage />)

        const input = screen.getByTestId("contrasenia")
        const botonOjito = screen.getByTestId("ojito")

        expect(input).toHaveAttribute("type", "password")

        fireEvent.click(botonOjito)
        expect(input).toHaveAttribute("type", "text")

        fireEvent.click(botonOjito)
        expect(input).toHaveAttribute("type", "password")
    })
    })

    //Contraseña - fuerte
    

})
