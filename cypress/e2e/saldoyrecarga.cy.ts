describe('Flujo de recarga de tarjeta TUYO', () => {
  beforeEach(() => {
    // Setear cookie con el token del usuario autenticado
    cy.setCookie(
      "token",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJjb3JyZW8iOiJqdWFucGFibG96dWx1YWdhLjAzMTFAZ21haWwuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzQ4NTI5MjQzLCJleHAiOjE3NDg1MzI4NDN9.8JgJRY7pLLTldERrnKgo55tFtGBE3VeM2PKnFYwTJZc"
    );
  });

  it('realiza recarga y muestra mensaje de éxito', () => {
    cy.visit('/saldo-y-recargas')

    cy.contains('$', { timeout: 20000 }).should('exist')

    cy.get('div')
      .contains(/\$\d{2,3}.\d{3}/)
      .invoke('text')
      .then((saldoInicial) => {
        cy.log('Saldo inicial:', saldoInicial)

        cy.contains('Recargar').click()

        cy.contains('Paso 1 de 3').should('exist')

        cy.get('input[type="email"]').clear().type('juan@correo.com')

        cy.contains('$20.000').click()

        cy.contains('Resumen de recarga').should('exist')
        cy.contains('Nuevo saldo').should('exist')

        cy.contains('Continuar al pago').click()

        cy.get('input[placeholder="1234 5678 9012 3456"]').type('4111111111111111')
        cy.get('input[placeholder="Como aparece en la tarjeta"]').type('JUAN DAVID')
        cy.get('input[placeholder="MM/YY"]').type('1230')
        cy.get('input[placeholder="123"]').type('123')

        cy.contains('Pagar').click()

        cy.contains('💳 Pago procesado exitosamente', { timeout: 10000 }).should('be.visible')

        cy.contains(/\$\d{2,3}.\d{3}/).should('not.have.text', saldoInicial)
      })
  })
})
