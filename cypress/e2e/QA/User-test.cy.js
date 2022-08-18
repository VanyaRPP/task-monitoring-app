describe("User", function(){
it("Logo", function(){
    cy.visit("https://taskmonitoringapp.herokuapp.com/")
    cy.location('protocol').should('eq','https:')
    cy.get('svg[class="style_Logo__92Yi2"]').should('be.visible')
    
    cy.get('button[class="ant-switch style_ThemeSwitcher__QMndo"]').click()
    cy.get('button[class="ant-btn ant-btn-primary ant-btn-background-ghost style_Button__Cs0lm"]')
    .should('be.visible')
    .click()
    cy.get('input[class="style_Input__Luugf"]')
    .type('test@test.com')
    .should('have.value','test@test.com')
    .click()

    cy.get('button[class="style_Button__SaKoO"]')
    .click()

  //  cy.get().click()
    cy.go('back')
  
   // cy.get('button[class="ant-btn ant-btn-primary ant-btn-background-ghost"]')
  //  .click()
    
    cy.get('input[id="nest-messages_name"]')
     .type('text')
     .should('have.value','text')

    cy.get('input[id="nest-messages_email"]')
     .type('123456@gmail.com')
     .should('have.value','123456@gmail.com')

    cy.get('textarea[id="nest-messages_message"]')
     .type('text')
     .should('have.value','text')

    cy.contains("Надіслати").click()


})

})