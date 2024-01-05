/// <reference types="cypress" />
// Cypress.on('uncaught:exception', (err, runnable) => {
//   // returning false here prevents Cypress from
//   // failing the test
//   return false
// })

describe('example to-do app', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
  })
  context('switch theme', () => {
    it('switch theme', () => {
      cy.contains('Увійти')
      cy.contains('Логін')
      cy.contains('Зв’яжіться з нами')
      cy.get('button[role="switch"]').click()
      cy.get('button[role="switch"]').click()
      cy.contains('Комунальник')
      cy.contains('Ваше електронне')
      cy.contains('житлово-комунальне господарство')
      cy.contains('Вітаємо Вас')
      // cy.contains(' на платформі електронних замовлень для домогосподарств. Тут Ви можете замовити або отримати роботу по встановленню/ремонту сантехніки, електрики, теплотехніки, кондиціонування та вентиляції, загальнобудівельним, столярним роботам (вікна, двері) та багато іншого. Вас')
    })
  })
  context('Zvazhitca z namu', () => {
    it('should have a form', () => {
      cy.contains('Зв’яжіться з нами').click()
      cy.get('input[placeholder="Ім’я"]')
        .should('have.value', '')
        .type('Hello')
        .should('have.value', 'Hello')
      cy.get('input[placeholder="Електронна пошта"]')
        .should('have.value', '')
        .type('vanassssssssss@gmail.com')
        .should('have.value', 'vanassssssssss@gmail.com')
      cy.get('textarea[placeholder="Повідомлення"]')
        .should('have.value', '')
        .type('Hello')
        .should('have.value', 'Hello')
      cy.contains('Надіслати')
    })
  })
})

context('Yviitu', () => {
  it('Enter to form', () => {
    cy.contains('Увійти').click()
    cy.contains('Увійти з Google')
    cy.contains('Увійти з GitHub')
    cy.contains('Увійти з Facebook')
    cy.get('input[placeholder="Введіть свою пошту"]')
      .should('have.value', '')
      .type('waw777@yopmail.com')
    cy.get('input[placeholder="Введіть пароль"]')
      .should('have.value', '')
      .type('Qweasd123zxc')
    cy.get('button[type="submit"]').contains('Увійти').click()
  })
})
