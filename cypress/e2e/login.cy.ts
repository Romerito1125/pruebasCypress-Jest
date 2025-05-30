describe('Inicio de sesión en la app TUYO', () => {
  it('permite iniciar sesión correctamente', () => {
    cy.visit('/')

    cy.contains('Iniciar sesión').click()

    cy.get('input[placeholder="correo@ejemplo.com"]').type('juan_pab.zuluaga@uao.edu.co')
    cy.get('input[placeholder="••••••••"]').type('Juan123+456')

    cy.contains('Ingresar').click()

    cy.contains('Bienvenido', { timeout: 8000 }).should('exist')
  })
})
