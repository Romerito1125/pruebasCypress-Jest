describe('Ruta T31 - Flujo de navegación y detalles', () => {
  it('navega a la página de rutas, selecciona T31 y verifica la información', () => {
    // 1. Ir a la página de rutas
    cy.visit('/rutas')

    // 2. Espera a que se cargue alguna tarjeta
    cy.contains('Terminal Paso del Comercio - Universidades', { timeout: 20000 }).should('exist')

    // 3. Hacer clic en la tarjeta de T31
    cy.contains('T31').click()

    // 4. Verificar que redirigió a la ruta de T31
    cy.url().should('include', '/rutas/') // ajusta si tienes ruta tipo /rutas/T31

    // 5. Verificar título
    cy.contains('T31').should('exist')
    cy.contains('Terminal Paso del Comercio').should('exist')

    // 6. Verificar horarios
    cy.contains(/5:00 AM - 11:00 PM/i).should('exist')

    // 7. Verificar estaciones (una al menos)
    cy.contains('Paso Del Comercio').should('exist')
    cy.contains('La Ermita').should('exist')
  })
})
