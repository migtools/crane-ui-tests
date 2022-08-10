import { pages } from '../integration/views/enums.view';
import * as loginView from '../integration/views/login.view';
import { navMenuPoint } from '../integration/views/menu.view';
import { editTargetNamepace, planNameInput, saveEdit, searchButton, searchInput, targetNamespace } from '../integration/views/plan.view';

const userName = Cypress.env('user');
const userPassword = Cypress.env('password');
const craneUiUrl = Cypress.env('craneUrl');

export function inputText(fieldId: string, text: string): void {
  cy.get(fieldId).clear().type(text, {timeout: 20000});
}

export function clickByText(fieldId: string, buttonText: string): void {
  cy.wait(500).contains(fieldId, buttonText).click();
}

export function click(fieldId: string): void {
  cy.get(fieldId).click();
}

export function login(): void {
  cy.visit(craneUiUrl);
  cy.get('body').then((body) => {
    if (body.find("h1:contains('Migration Toolkit for Containers')").length != 1) {
      cy.findByText('kube:admin').click();
      inputText(loginView.userNameInput, userName);
      inputText(loginView.userPasswordInput, userPassword);
      clickByText('button', 'Log in');
    }
  })
}

export function next(): void {
  cy.xpath('//button[contains(text(), "Next")]')
  // clickByText('button', 'Next');
}

export function back(): void {
  clickByText('button', 'Back');
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

export function searchAndSelectNamespace(namespace: string): void {
  inputText(searchInput, namespace);
  cy.get(searchButton).first().click();
  cy.get('td')
    .contains(namespace)
    .parent('tr')
    .within(() => {
      click('input');
    })
}

export function navigateToPage(pageName: pages): void {
  clickByText(navMenuPoint, pageName);
}

export function fillGeneralFields(name, source, target, repo, migration_type): void {
  inputText(planNameInput, name);
  selectFromDroplist('Select...', migration_type)
  selectFromDroplist('Select source', source);
  if (migration_type == 'Full migration' || migration_type == 'State migration') {
    selectFromDroplist('Select target', target);
    selectFromDroplist('Select repository', repo);
  }
}

export function editTargetNamespace(namespace): void {
  cy.get('td')
    .contains(namespace)
    .parent('tr')
    .within(() => {
      click(editTargetNamepace);
    });
  inputText(targetNamespace, namespace + '-new');
  click(saveEdit);
}


export function log(fileName: string, result: any) {
  const { code, stdout, stderr } = result
  if (code != 0) {
    cy.writeFile('./cypress/reports/' + fileName.replace(' ', '_') + '_err.txt', stderr)
  }
  cy.writeFile('./cypress/reports/' + fileName.replace(' ', '_') + '_output.txt', stdout)
}
