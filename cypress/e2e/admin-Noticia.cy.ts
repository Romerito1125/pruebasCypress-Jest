describe("Crear alerta desde el panel de noticias", () => {
  beforeEach(() => {
    cy.setCookie(
      "token",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJjb3JyZW8iOiJqdWFucGFibG96dWx1YWdhLjAzMTFAZ21haWwuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzQ4NTI5MjQzLCJleHAiOjE3NDg1MzI4NDN9.8JgJRY7pLLTldERrnKgo55tFtGBE3VeM2PKnFYwTJZc"
    );
    cy.visit("/");
  });
  it("crea una alerta válida con tipo, estación y prioridad", () => {
    cy.contains("Noticias y alertas").click();
    cy.url().should("include", "/noticias");
    cy.contains("Crear Noticia").click();

    cy.get('input[placeholder="Título de la noticia..."]').type("Prueba E2E");
    cy.get('textarea[placeholder="Describe la noticia en detalle..."]').type(
      "Se están realizando las pruebas E2E de la aplicación, y se esperan que todas salgan correctas en la parte de administración"
    );
    cy.get('input[placeholder="Nombre del autor"]').type("Cypress Test");

    cy.get("button").contains("Crear Noticia").click();

    cy.contains("Noticia creada correctamente!", { timeout: 5000 }).should(
      "be.visible"
    );
  });
});
