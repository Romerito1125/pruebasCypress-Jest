describe('Panel de administración de denuncias', () => {
  beforeEach(() => {
    cy.setCookie('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJjb3JyZW8iOiJqdWFucGFibG96dWx1YWdhLjAzMTFAZ21haWwuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzQ4NTI5MjQzLCJleHAiOjE3NDg1MzI4NDN9.8JgJRY7pLLTldERrnKgo55tFtGBE3VeM2PKnFYwTJZc')

    cy.visit('/')
  })
;
  it('permite responder una denuncia pendiente', () => {
    cy.contains('Denuncias').click()
    cy.url().should('include', '/denuncias')
    cy.contains('Administración').click()

    cy.get('button').contains('Responder denuncia').first().click()

    cy.get('textarea').type('Respuesta de prueba automática')

    // Envía
    cy.get('button').contains('Enviar respuesta').click()

    cy.contains('Procesada', { timeout: 5000 }).should('exist')
  })
})
