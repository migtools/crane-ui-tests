import {PlanData} from "../types/types";
import {login, next} from "../../utils/utils";
import {Plan} from "../models/plan";
import {run_command_oc} from "../../utils/oc_wrapper";

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');
const configurationScript = "./cypress/utils/configuration_script.sh"

describe('mtc_83_storage_class_options', () => {

    const plan = new Plan();

    const planData: PlanData = {
        name: 'mtc-83-storage-class-options-migplan',
        source: 'source-cluster',
        target: 'host',
        repo: 'automatic',
        migration_type: 'Full migration',
        namespaceList: ['mtc-83-storage-class-options'],
        directImageMigration: true,
        directPvmigration: true,
        verifyCopy: true
    };

    // setup source cluster
    before('Setup clusters', () => {
        cy.exec(`"${configurationScript}" setup_source_cluster "${planData.namespaceList}" ${sourceCluster}`, {timeout: 400000});
        cy.exec(`"${configurationScript}" setup_target_cluster "${planData.namespaceList}" ${targetCluster}`, {timeout: 400000});
    });

    // login
    it('Login', () => {
        login();
    })

    // create migplan
    it('Create migplan', () => {
        plan.create(planData);
    });
    // execute migplan
    it('Execute migplan', () => {
        plan.execute(planData);
    });

    // validate & cleanup target cluster
    after('Validate Migration', () => {
        cy.exec(`""${configurationScript}"" post_migration_verification_on_target ${planData.namespaceList} ${targetCluster}`);
    });

    // Verify that pvc is using default storageclass
    it('Verify that pvc is using default storageclass', () => {
        run_command_oc('target', `get pvc -n ${planData.namespaceList[0]} -o yaml`).its('stdout').should('contain', 'storageClassName: standard')
    })

    // rollback migplan
    it('Rollback migplan', () => {
        plan.rollback(planData);
    });

    //Edit migplan & change storage class to None
    it('Edit migplan & change storage class to None', () => {
        plan.editMigplan(planData.name);
        next();
        next();
        next();
        plan.selectStorageClass('None')
        next();
        next();
        next();
        // close the migplan creation wizard
        plan.closeWizard()
        //Wait for plan to be in 'Ready' state
        plan.waitForReady(planData.name);
    });

    // assert the PvNoStorageClassSelection warning exists
    it('Assert the PvNoStorageClassSelection warning exists', () => {
        run_command_oc('target', ` get migplan ${planData.name} -n openshift-migration -o yaml`).its('stdout').should('contain', 'type: PvNoStorageClassSelection');
    });

    // validate & cleanup target cluster
    after('Clean resources', () => {
        cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} ${sourceCluster}`, {timeout: 400000});
    });
});