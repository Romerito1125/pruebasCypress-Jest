describe('Registro de usuario nuevo', () => {
  it('va al formulario y se registra exitosamente', () => {
    cy.visit('/')

    cy.contains('Registrarse').click()

    cy.get('input[placeholder="Nombre"]').type('Cypress')
    cy.get('input[placeholder="Apellido"]').type('Test')
    cy.get('input[placeholder="correo@ejemplo.com"]').type('juan_pab.zuluaga@uao.edu.co')
    cy.get('input[placeholder="Mínimo 8 caracteres"]').type('Juan123+456')

    cy.contains('Crear cuenta').click()

    cy.contains("Registro exitoso", { timeout: 10000 }).should('exist')
  })
})
