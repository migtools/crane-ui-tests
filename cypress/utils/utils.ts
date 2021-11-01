import * as loginView from '../integration/views/login.view';

const userName = Cypress.env('user');
const userPassword = Cypress.env('pass');
const craneUiUrl = Cypress.env('craneUrl');
const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');

export function inputText(fieldId: string, text: string): void {
  cy.get(fieldId).clear().type(text);
}

export function clickByText(fieldId: string, buttonText: string): void {
  cy.contains(fieldId, buttonText).click();
}

export function click(fieldId: string): void {
  cy.get(fieldId).click();
}

export function login(): void {
  cy.visit(craneUiUrl);
  cy.findByText('kube:admin').click();
  inputText(loginView.userNameInput, userName);
  inputText(loginView.userPasswordInput, userPassword);
  clickByText('button', 'Log in');
}

export function next(): void {
  clickByText('button', 'Next');
}

export function selectFromDroplist(selector: string, selectionMade: string): void {
  clickByText('button', selector);
  clickByText('button', selectionMade);
}

export function getTd(columnValue: string, locator: string, tdValue: string): void {
  cy.get('td')
    .contains(columnValue)
    .closest('tr')
    .within(() => {
      cy.get(locator).contains(tdValue, { timeout: 2000 });
    });
}

export function setup_source_cluster(): void {
  //This function creates a new project and application for migration on source cluster.
  //TO DO: Remove hardcoding of project name.

  cy.exec(`${sourceCluster} --insecure-skip-tls-verify`, { failOnNonZeroExit: true });
  //If project exists, delete the project before proceeding
  cy.exec(`oc new-project nandini`, { failOnNonZeroExit: true });
  cy.exec(`oc new-app django-psql-persistent`, { failOnNonZeroExit: true });

  //Verify that application is running
  cy.exec(`curl $(oc get routes -n nandini | grep django| awk '{print $2}')`, { failOnNonZeroExit: true } )
}

export function cleanup_source_cluster(): void {
  //This function deletes the project in which the application(to be migrated)exists.
  cy.exec(`${sourceCluster} --insecure-skip-tls-verify`, { failOnNonZeroExit: true });
  cy.exec('oc delete project nandini', { failOnNonZeroExit: true });
}

export function post_migration_verification(): void {
  //This function verifies that application is running fine on the target cluster after migration.
  cy.exec(`${targetCluster} --insecure-skip-tls-verify`, { failOnNonZeroExit: true });
  cy.exec(`curl $(oc get routes -n nandini | grep django| awk '{print $2}')`, { failOnNonZeroExit: true });
  cy.exec(`oc delete project nandini`, { failOnNonZeroExit: true });
}
