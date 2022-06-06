import { back, clickByText, log, login, navigateToPage, next, searchAndSelectNamespace } from "../../utils/utils";
import { PlanData } from "../types/types";
import { Plan } from '../models/plan'
import { pages } from '../views/enums.view'

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');
const configurationScript = "./cypress/utils/configuration_script.sh"


describe('mtc-80-moving-back-general-page', () => {

    const plan = new Plan();

    const planData: PlanData = {
        name: 'mtc-80-back-general-page-migplan',
        source: 'source-cluster',
        target: 'host',
        repo: 'automatic',
        migration_type: 'Full migration',
        namespaceList: ['mtc-80-back-general-page'],
        directImageMigration : false,
        directPvmigration : false,
      };


    before('Setup clusters', () => {
        cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} ${sourceCluster}`, { timeout: 200000 }).then((result) => {
            log(`'mtc_80_back_to_general_page_setup_source_cluster'`, result)
        });
        cy.exec(`"${configurationScript}" setup_target_cluster ${planData.namespaceList} ${targetCluster}`, { timeout: 200000 }).then((result) => {
            log(`'mtc_80_back_to_general_page_setup_target_cluster'`, result)
        });
    });

    // login
    it('Login', () => {
        login();
    });

    // create migplan & traverse pages
    it('Create Migplan & move back to general page', () => {

        // naviage to migration plans page
        navigateToPage(pages.migrationPlans)

        // click on add migration plan
        clickByText('button', 'Add migration plan');
        
        // fill the general step fields
        plan.generalStep(planData);

        // search & select a namespace and click 'next'
        plan.selectNamespace(planData);

        // move back to namespace page & wait for the 'back' button to display and be clickable
        back(); 
        cy.contains('button', 'Back', { timeout: 200000 }).should('be.enabled');

        // move back to general page and check the message doesn't exist and the 'next' button is enabled
        back(); 
        cy.contains('button', 'Next', { timeout: 200000 }).should('be.enabled');

        cy.contains('A plan with that name already exists. Enter a unique name for the migration plan.').should('not.exist');
        
        // click next to move to namespaces page
        next();

        // click next to move to persistent volume page
        next();
        
        // process persistent volume page and click next
        plan.persistentVolumes();

        // process copy options page and click next
        plan.copyOptions(planData);

        // process migration options page and click next
        plan.migrationOptions(planData);

        // process hooks page and click next
        plan.hooks();

        // CLose the creation wizard
        plan.closeWizard();

        // wait for the migplan to be ready
        plan.waitForReady(planData.name);

    });

    it('Delete migplan', () => {
        plan.delete(planData);
    })

    // validate & clean
    after('Validate Migration & clean resources', () => {
        cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} ${sourceCluster}`, { timeout: 100000 }).then((result) => {
            log(`'mtc_80_back_to_general_page_cleanup_source_cluster'`, result)
        });
    });
});