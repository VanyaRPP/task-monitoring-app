// run in cmd with "yarn test filename | npm test filename"
const emailRegex =  /^([a-zA-Z0-9_]{6,30})@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
// const emailRegex = /^[a-zA-Z0-9_.]{6,30}@(?!.*\d)[a-zA-Z][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
const { expect, test, toBeTruthy, toBeFalsy } = require('@jest/globals');

describe('isValidValidation', () => {
    test('email is valid', () => {
        expect(emailRegex.test("pluserwork24@gmail.com")).toBeTruthy();
    });
    test("email is valid",()=>{
        expect(emailRegex.test("my.yershov@gmail.com")).toBeTruthy();
    });
    test("email is valid",()=>{
        expect(emailRegex.test("my.yershov@gmail.com")).toBeTruthy();
    });
    test('email is invalid', () => {
        expect(emailRegex.test("example@2mail.con")).toBeFalsy();
    });
    test('email is invalid', () => {
        expect(emailRegex.test("example2!2@<mail.con")).toBeFalsy();
    });
});
