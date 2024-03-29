import { PlanData } from '../types/types';
import { clickByText, click, inputText, next, selectFromDroplist, getTd } from '../../utils/utils';
import { navMenuPoint } from '../views/menu.view';
import { planNameInput, searchInput, searchButton, directPvMigrationCheckbox, verifyCopyCheckbox,
  directImageMigrationCheckbox, dataLabel, kebab, kebabDropDownItem, editTargetNamepace } from '../views/plan.view';

const saveEdit = 'span#save-edit-icon';
const targetNamespace = 'input[name="currentTargetNamespaceName"]';

export class Plan {
  protected static openList(): void {
    clickByText(navMenuPoint, 'Migration plans');
  }
  
  protected generalStep(planData: PlanData): void {
    const { name, source, target, repo } = planData;
    inputText(planNameInput, name);
    selectFromDroplist('Select source', source);
    selectFromDroplist('Select target', target);
    selectFromDroplist('Select repository', repo);
    next();
  }

  protected selectNamespace(planData: PlanData): void {
    const { namespaceList, nondefaultTargetNamespace } = planData;
    namespaceList.forEach((name) => {
      inputText(searchInput, name);
      cy.get(searchButton).first().click();
      cy.get('td')
        .contains(name)
        .parent('tr')
        .within(() => {
          click('input');
        });

      //Update target namespace if project is being migrated to non default namespace
      if (nondefaultTargetNamespace) {
        cy.get('td')
          .contains(name)
          .parent('tr')
          .within(() => {
            click(editTargetNamepace);
        });
        inputText(targetNamespace, 'non-default');
        click(saveEdit);
      }
    });
    next();
  }

  protected persistentVolumes(): void {
    //Wait for PVs to be listed and the 'Next' button to be enabled
    cy.contains('button', 'Next', { timeout: 200000 }).should('be.enabled');
    next();
  }

  protected copyOptions(planData: PlanData): void {
    const { verifyCopy } = planData;
    if (verifyCopy) {
      cy.get(verifyCopyCheckbox, { timeout: 20000 }).should('be.enabled').check();
      //Close copy performance warning
      clickByText('button', 'Close');
    }
    next();
  }

  protected migrationOptions(planData: PlanData): void {
    const { directPvmigration, directImageMigration } = planData;
    if (directPvmigration)
      cy.get(directPvMigrationCheckbox, { timeout: 20000 }).should('be.enabled').check();
    else
      cy.get(directPvMigrationCheckbox, { timeout: 20000 }).should('be.enabled').uncheck();

    if (directImageMigration)
      cy.get(directImageMigrationCheckbox, { timeout: 20000 }).should('be.enabled').check();
    else
      cy.get(directImageMigrationCheckbox)
        .invoke('attr', 'enabled')
        .then(enabled => {
          enabled ? cy.log('Button is disabled') : cy.get(directImageMigrationCheckbox).uncheck();
      })

      next();
  }

  protected hooks(): void {
    clickByText('button', 'Finish');
  }

  protected run(name: string): void {
    cy.get('th')
      .contains(name)
      .parent('tr')
      .within(() => {
        click(kebab);
    });
    clickByText(kebabDropDownItem, 'Cutover');
    cy.get('#transaction-halt-checkbox').uncheck()
    //Confirm dialog before migration
    clickByText('button', 'Migrate');
  }

  protected waitForNotReady(name: string): void {
    cy.get('th')
      .contains(name)
      .closest('tr')
      .within(() => {
        cy.get(dataLabel.status).contains('Not Ready', { timeout: 2000 });
      });
  }

  protected waitForReady(name: string): void {
    cy.get('th')
      .contains(name)
      .closest('tr')
      .within(() => {
        cy.get(dataLabel.status).contains('Ready', { timeout: 10000 });
      });
  }

  protected waitForSuccess(name: string): void {
    cy.get('th')
      .contains(name, { timeout: 10000 })
      .closest('tr')
      .within(() => {
        cy.get(dataLabel.status).contains('Migration succeeded', { timeout: 600000 });
      });
  }

  protected waitForRollbackSuccess(name: string): void {
    cy.get('th')
      .contains(name, { timeout: 10000 })
      .closest('tr')
      .within(() => {
        cy.get(dataLabel.status).contains('Rollback succeeded', { timeout: 600000 });
      });
  }
  
  stepStatus(step): void {
    getTd(step, '[data-label="Status"]', 'Complete');
  }

  stepProgress(step): void {
    getTd(step, '.pf-c-progress__measure', '100%');
  }

  create(planData: PlanData): void {
    const { name } = planData;

    //Navigate to 'Migration plans tab and create a new plan
    Plan.openList();
    clickByText('button', 'Add migration plan');
    this.generalStep(planData);
    this.selectNamespace(planData);
    this.persistentVolumes();
    this.copyOptions(planData);
    this.migrationOptions(planData);
    this.hooks();

    //Assert that plan is successfully validated before being run
    cy.get('span#condition-message').should('contain', 'The migration plan is ready', { timeout : 10000 });
    cy.wait(500).findByText("Close").click();

    //Wait for plan to be in 'Ready' state
    this.waitForReady(name);
  }

  execute(planData: PlanData): void {
    const { name } = planData;
    Plan.openList();
    this.run(name);
    this.waitForSuccess(name);
  }

  pipelineStatus(migrationType: string, planData: PlanData): void {
    const { name } = planData;

    // On the migration plan list page, click on the link in the 'Migrations' column
    cy.get('th')
    .contains(name)
    .closest('tr')
    .within(() => {
      cy.get('span.pf-c-icon.pf-m-info').click();
    });

    // Proceed with checking the status of the individual pipeline steps only if Cutover/Stage/Migration
    // has successfully completed.
    // While on the 'Migrations' page, verify that status for Cutover/Stage/Migration shows 'Completed'.

    cy.get('td')
      .contains('Cutover')
      .closest('tr')
      .within(() => {
        cy.get('[data-label="Status"]').contains('Completed', { timeout: 2000 });
      })
    cy.get('td').contains('Cutover').click();

    //Pipeline steps common to both migration and staged migration
    this.stepStatus('Prepare');
    this.stepStatus('StageBackup');
    this.stepStatus('Cleanup');

    if (migrationType.match('Stage'))
    //Pipeline step specific to staged migration
      this.stepStatus('StageRestore');
    else 
    //Pipeline step specific to migration
      this.stepStatus('Backup');
      this.stepProgress('Backup');
      this.stepStatus('DirectImage');
      this.stepStatus('DirectVolume');
      this.stepStatus('Restore');
      this.stepProgress('Restore');
  }

  delete(planData: PlanData): void {
    const { name } = planData;
    Plan.openList();
    cy.get('th')
      .contains(name)
      .parent('tr')
      .within(() => {
        click(kebab);
    });
    clickByText(kebabDropDownItem, 'Delete');

    //Confirm dialog before deletion
    clickByText('button', 'Confirm');

    //Wait for plan to be deleted
    cy.findByText(`Successfully removed plan "${name}"!`, {timeout : 15000});
  }

  rollback(planData: PlanData): void {
    const { name } = planData;
    Plan.openList();
    cy.get('th')
      .contains(name)
      .parent('tr')
      .within(() => {
        click(kebab);
    });
    clickByText(kebabDropDownItem, 'Rollback');

    //Confirm dialog before Rollback migration
    clickByText('button', 'Rollback');

    this.waitForRollbackSuccess(name);
  }
}
