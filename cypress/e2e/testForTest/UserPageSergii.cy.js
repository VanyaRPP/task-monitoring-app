/// <reference types="cypress" />

describe('example to-do app', () => {
  it('should visit', () => {
    cy.visit('http://localhost:3000/')
  })
})
context('My tasks', () => {
  it('My tasks', () => {
    cy.contains('Мої замовлення').click()
  })
})
