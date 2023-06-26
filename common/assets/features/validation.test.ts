// run in cmd with "yarn test filename | npm test filename"
import { emailRegex } from "./validators";
const { expect, test, toBeTruthy, toBeFalsy } = require('@jest/globals');
// const emailRegex = /^[a-zA-Z0-9_.]{6,30}@(?!.*\d)[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

describe('isValidValidation', () => {
    test('email is valid', () => {
        expect(emailRegex.test("pluserwork24@gmail.com")).toBeTruthy();
        expect(emailRegex.test("exampletest@mail.ua")).toBeTruthy();
        expect(emailRegex.test("my.yershov@gmail.com")).toBeTruthy();
    });
    test('email is invalid', () => {
        expect(emailRegex.test("example@2mail.con")).toBeFalsy();
        expect(emailRegex.test("example2!2@<mail.con")).toBeFalsy();
    });
});
