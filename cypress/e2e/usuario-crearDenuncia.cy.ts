describe('Panel de administración de denuncias', () => {
  beforeEach(() => {
    cy.setCookie('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJjb3JyZW8iOiJqdWFucGFibG96dWx1YWdhLjAzMTFAZ21haWwuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzQ4NTI5MjQzLCJleHAiOjE3NDg1MzI4NDN9.8JgJRY7pLLTldERrnKgo55tFtGBE3VeM2PKnFYwTJZc')

    cy.visit('/')
  })
;
  it('permite responder una denuncia pendiente', () => {
    cy.contains('Denuncias').click()
    cy.url().should('include', '/denuncias')
     cy.get('textarea[placeholder="Describe el problema o incidente con el mayor detalle posible..."]').type(
      "Se están realizando las pruebas E2E de la aplicación, y se esperan que todas salgan correctas en la parte de creación de denuncias"
    );

    cy.get('textarea').type('Respuesta de prueba automática')

    // Envía
    cy.get('button').contains('Enviar denuncia').click()

    cy.contains('¡Denuncia enviada!', { timeout: 5000 }).should('exist')
  })
})
