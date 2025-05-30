describe('Página Buses por Estación', () => {
  it('espera a que carguen las estaciones y muestra buses correctamente', () => {
    cy.visit('/buses-por-estacion')

    // Espera hasta 20s a que aparezca algo como "Ruta"
    cy.contains('Ruta', { timeout: 20000 }).should('exist')

    // Verifica que alguna estación esté renderizada
    cy.get('div').contains('Universidades').should('exist')

    // Verifica que se muestre un tiempo estimado o "Llegó"
    cy.contains(/min|Llegó/, { timeout: 20000 }).should('exist')
  })

  it('permite usar el buscador', () => {
    cy.visit('/buses-por-estacion')

    cy.contains('Ruta', { timeout: 20000 }).should('exist')

    cy.get('input[placeholder="Buscar estación..."]').type('centro')

    cy.contains('Centro', { matchCase: false }).should('exist')
  })
})
