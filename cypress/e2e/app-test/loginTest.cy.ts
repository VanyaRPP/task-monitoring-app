// const env = require("../../cypress.json");

// // Функція для отримання значення куки за іменем
// const getCookie = (cookies, name) => {
//   const cookie = cookies.find(c => c.name === name);
//   return cookie ? cookie.value : null;
// };

// describe('Логінізація', () => {
//   it('Успішний вхід через GitHub', () => {
//     cy.visit('http://localhost:3000/');
//     cy.get('button:contains("Увійти")').click();
//     cy.get('button:contains("Увійти з GitHub")').should('exist');
//     cy.get('button:contains("Увійти з GitHub")').click();
    
//     // Очікуємо на перехід та перевіряємо URL
//     cy.url().should('include', 'http://localhost:3000/auth/sigin');

//     cy.get('input[name="login"]').type(env.GIT_LOGIN);
//     cy.get('input[name="password"]').type(env.GIT_PASSWORD);

//     cy.get('input[name="commit"]').click();

//     // Отримуємо куки
//     cy.getCookies().should((cookies) => {
//       // Логуємо куки для перевірки
//       console.log(cookies);

//       // Отримуємо значення кожної куки
//       const nextState = getCookie(cookies, 'next-auth.state');
//       const csrfToken = getCookie(cookies, 'next-auth.csrf-token');
//       const callbackUrl = getCookie(cookies, 'next-auth.callback-url');

//       // Встановлюємо куки на нашому сайті
//       cy.setCookie('next-auth.state', nextState);
//       cy.setCookie('next-auth.csrf-token', csrfToken);
//       cy.setCookie('next-auth.callback-url', callbackUrl);
//     });

//     cy.location('pathname', { timeout: 10000 }).should('eq', '/');



//     // Перевірка наявності кнопок після логіну
//     cy.get('button:contains("Адреса")').should('exist');
//     cy.get('button:contains("Надавачі послуг")').should('exist');
//     cy.get('button:contains("Компанії")').should('exist');

//     cy.log('Тест успішно завершено!');
//   });
// });

const env = require("../../cypress.json");

// Функція для отримання та збереження куків
const loginAndSaveCookies = () => {
  cy.visit('http://localhost:3000/');
  cy.get('button:contains("Увійти")').click();
  cy.get('button:contains("Увійти з GitHub")').should('exist');
  cy.get('button:contains("Увійти з GitHub")').click();

  // Очікуємо на перехід та перевіряємо URL
  cy.url().should('include', 'http://localhost:3000/auth/sigin');

  // Введення логіна та пароля
  cy.get('input[name="login"]').type(env.GIT_LOGIN);
  cy.get('input[name="password"]').type(env.GIT_PASSWORD);
  cy.get('input[name="commit"]').click();

  // Отримання та збереження куки в змінну
  cy.getCookies().then((cookies) => {
    // Логуємо куки для перевірки
    console.log(cookies);

    // Отримуємо та використовуємо значення кожної куки
    cookies.forEach((cookie) => {
      cy.setCookie(cookie.name, cookie.value);
    });
  });
};

describe('Логінізація та використання куків', () => {
  before(() => {
    // Виклик функції для отримання та збереження куків перед усіма тестами
    loginAndSaveCookies();
  });

  it('Перевірка доступу після логіну', () => {
    // Перевірка доступу
    cy.visit('http://localhost:3000/');

    cy.wait(3000);

    // Додаткові перевірки після логіну
    cy.get('button:contains("Адреса")').should('exist');
    cy.get('button:contains("Надавачі послуг")').should('exist');
    cy.get('button:contains("Компанії")').should('exist');
  });
});
