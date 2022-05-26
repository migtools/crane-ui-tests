import { login } from "../../utils/utils";

describe('Log In', () => {

    it('Login to MTC UI', () => {
        login();

        // Assert that home page has loaded after login
        cy.get('h1').should('contain', 'Migration Toolkit for Containers')
    });
});
