describe('Simulación en tiempo real - Ruta T31', () => {
  it('carga estaciones y muestra información del bus 11001', () => {
    cy.visit('/buses-realtime')

    cy.get('input[type="text"]').type('T31')

    cy.contains('Enviar').click()


    cy.wait(31000)

    cy.get('div[title="Bus 11001"]').click()

    cy.contains('🚌 Bus 11001').should('exist')
    cy.contains('Ruta: T31').should('exist')

  })
})
