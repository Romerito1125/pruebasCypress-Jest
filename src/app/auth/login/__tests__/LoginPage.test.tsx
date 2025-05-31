import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LoginPage from "../page"
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
jest.mock('@/lib/supaClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
    })),
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  //Prueba unitaria, Funcional
    describe("Validación de correo válido", () => {
        it("muestra error si el correo no es válido", async () => {
        const spyLogin = jest.spyOn(utils, "loginUsuario").mockResolvedValue({ token: "fake" })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), {
            target: { value: "example" },
        })
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
            target: { value: "hola123456" },
        })
        fireEvent.click(screen.getByText("Ingresar"))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Ingresa un correo electrónico válido")
            expect(spyLogin).not.toHaveBeenCalled()
        })
        })
    })

    //Prueba unitaria, Funcional
    describe("Validación de contraseña vacía", () => {
        it("muestra error si la contraseña no es válida", async () => {
        const spyLogin = jest.spyOn(utils, "loginUsuario").mockResolvedValue({ token: "fake" })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), {
            target: { value: "example@gmail.com" },
        })
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
            target: { value: "" },
        })
        fireEvent.click(screen.getByText("Ingresar"))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("La contraseña no puede estar vacía")
            expect(spyLogin).not.toHaveBeenCalled()
        })
        })
    })

        describe("Validación de campos", () => {
        it("muestra error si la contraseña no es válida", async () => {
        const spyLogin = jest.spyOn(utils, "loginUsuario").mockResolvedValue({ token: "fake" })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), {
            target: { value: "" },
        })
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
            target: { value: "" },
        })
        fireEvent.click(screen.getByText("Ingresar"))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Completa todos los campos")
            expect(spyLogin).not.toHaveBeenCalled()
        })
        })
    })

    describe("Validación de correo vacío", () => {
        it("muestra error si la contraseña no es válida", async () => {
        const spyLogin = jest.spyOn(utils, "loginUsuario").mockResolvedValue({ token: "fake" })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), {
            target: { value: "" },
        })
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
            target: { value: "1234" },
        })
        fireEvent.click(screen.getByText("Ingresar"))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("Ingresa un correo electrónico válido")
            expect(spyLogin).not.toHaveBeenCalled()
        })
        })
    })


    describe("Validación de longitud de contraseña", () => {
        it("muestra error si la contraseña no es válida", async () => {
        const spyLogin = jest.spyOn(utils, "loginUsuario").mockResolvedValue({ token: "fake" })

        render(<LoginPage />)

        fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), {
            target: { value: "example@gmail.com" },
        })
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
            target: { value: "1234" },
        })
        fireEvent.click(screen.getByText("Ingresar"))

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("La contraseña debe tener al menos 6 caracteres")
            expect(spyLogin).not.toHaveBeenCalled()
        })
        })
    })

    //Prueba de integración, Funcional
    describe("Login exitoso", () => {
    it("llama a loginUsuario con datos correctos", async () => {
      const spyLogin = jest.spyOn(utils, "loginUsuario").mockResolvedValue({ token: "fake-token" })

      render(<LoginPage />)

      fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), {
        target: { value: "davidjuan.2727@gmail.com" },
      })
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
        target: { value: "Deporcali2_" },
      })

      fireEvent.click(screen.getByText("Ingresar"))

      await waitFor(() => {
        expect(spyLogin).toHaveBeenCalledWith({
          correo: "davidjuan.2727@gmail.com",
          contrasenia: "Deporcali2_",
        })
        expect(toast.success).toHaveBeenCalledWith("Bienvenido 👋")
      })
    })
  })


  //Prueba de integración, Funcional
  describe("Login fallido", () => {
    it("muestra mensaje de error si loginUsuario lanza excepción", async () => {
      const spyLogin = jest.spyOn(utils, "loginUsuario").mockRejectedValue(new Error("Credenciales inválidas"))

      render(<LoginPage />)

      fireEvent.change(screen.getByPlaceholderText(/correo@ejemplo.com/i), {
        target: { value: "davidjuan.2727@gmail.com" },
      })
      fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
        target: { value: "Deporcali2__" },
      })

      fireEvent.click(screen.getByText("Ingresar"))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Credenciales inválidas")
      })
    })
  })



})
