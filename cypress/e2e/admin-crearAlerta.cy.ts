describe('Crear alerta desde el panel de noticias', () => {
  beforeEach(() => {
    cy.setCookie('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJjb3JyZW8iOiJqdWFucGFibG96dWx1YWdhLjAzMTFAZ21haWwuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzQ4NTI5MjQzLCJleHAiOjE3NDg1MzI4NDN9.8JgJRY7pLLTldERrnKgo55tFtGBE3VeM2PKnFYwTJZc')
    cy.visit('/noticias')
  })

  it('crea una alerta válida con tipo, estación y prioridad', () => {
    cy.contains('Crear Alerta').click()

    cy.get('input[placeholder="Demora, cierre, accidente."]').type('Accidente')
    cy.get('textarea[placeholder="Describe la alerta en detalle..."]').type('Se salió la llanta del bus y casi mata a alguien')

    cy.get('select').eq(0).select(1)
    cy.get('select').eq(1).select(1)

    cy.get('select').eq(2).select('Alta')

    cy.get('button').contains('Crear Alerta').click()

    cy.contains('¡Alerta creada exitosamente!', { timeout: 5000 }).should('be.visible')
  })
})
