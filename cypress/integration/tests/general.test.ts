import { createProject, deleteProject, loginToSource } from "../../utils/oc_wrapper";
import { clickByText, editTargetNamespace, fillGeneralFields, login, navigateToPage, next, searchAndSelectNamespace } from "../../utils/utils";
import { pages } from "../views/enums.view";

describe('Log In', () => {

    it('Login to MTC UI', () => {
        login();

        // Assert that home page has loaded after login
        cy.get('h1').should('contain', 'Migration Toolkit for Containers')
    });
});


describe('mtc-343-target-cluster-field-editable', () =>{
    
    it('mtc-343-target-cluster-field-editable', () =>{
        let namespace = 'mtc-343-namespace'
        loginToSource()
        createProject(namespace)
        login();
        navigateToPage(pages.migrationPlans)
        clickByText('button', 'Add migration plan');
        fillGeneralFields( namespace + '-migplan', 'source-cluster', 'host', 'automatic', 'Full migration')
        next();
        searchAndSelectNamespace(namespace)
        editTargetNamespace(namespace)
        deleteProject(namespace)
    })
});