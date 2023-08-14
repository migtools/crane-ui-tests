import {
    storageClassConversionSource,
    IntraClusterStateSource,
} from './cluster_config';
import {login, log} from '../../utils/utils';
import {Plan} from '../models/plan'
import {PlanData} from '../types/types';
import {run_command_oc} from "../../utils/oc_wrapper";
import {skipOn} from '@cypress/skip-test'

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');
const configurationScript = "./cypress/utils/configuration_script.sh"

const plan = new Plan();

const selectorTuple: [PlanData, string][] = [
    [storageClassConversionSource, 'Storage class conversion - Source cluster'],
    [storageClassConversionSource, 'Storage class conversion - Source-Rollover'],
    [IntraClusterStateSource, 'Intra cluster state migration - Source cluster'],
];

selectorTuple.forEach(($type) => {
    const [planData, migrationType] = $type;
    let selectedCluster = null


    describe(`'${migrationType}'`, () => {

        // if this is a state migraiton or scc, then check there are more than 1 sc available, if not, then skip the test
        if (['Storage class conversion', 'State migration'].indexOf(`${planData.migration_type}`) > -1) {

            before('Check SC', () => {
                (`${planData.source}` == 'source-cluster') ? selectedCluster = sourceCluster : selectedCluster = targetCluster;

                if (planData.migration_type == 'Storage class conversion') {
                    run_command_oc((planData.source == 'source-cluster') ? 'source' : 'target', 'get sc | wc -l').then((result) => {
                        let count: number = parseInt(result.stdout)
                        skipOn(count <= 2)
                    });
                }
            });
        }

        // run before the all coming tests
        it('Setting up Clusters', () => {
            if (['Storage class conversion', 'State migration'].indexOf(`${planData.migration_type}`) > -1) {

                cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} ${selectedCluster}`, {timeout: 200000}).then((result) => {
                    log(`'${migrationType}_setup_source_cluster'`, result)
                });

            } else {
                cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} ${sourceCluster}`, {timeout: 200000}).then((result) => {
                    log(`'${migrationType}_setup_source_cluster'`, result)
                });
                cy.exec(`"${configurationScript}" setup_target_cluster ${planData.namespaceList} ${targetCluster}`, {timeout: 200000}).then((result) => {
                    log(`'${migrationType}_setup_target_cluster'`, result)
                });
            }
        });

        // login
        it('Login', () => {
            login();
        });

        // Create Migplan
        it('Create Migplan', () => {
            plan.create(planData);
        });

        // Execute Migplan
        it('Execute Migplan', () => {
            plan.execute(planData);
        });

        // execute rollback if required
        if (migrationType.indexOf('Rollover') >= 0) {
            it('Execute Rollback', () => {
                plan.rollback(planData);
                if (migrationType.indexOf('Storage class conversion') < 0) {
                    plan.assertRollbackDataCleaned(planData);
                }
            });
        }

        //check pipeline
        if (`${migrationType}` == 'Direct image and PV migration') {
            it('Check Pipeline steps', () => {
                plan.pipelineStatus(migrationType, planData);
            });
        }

        // delete migplan
        it('Delete migplan', () => {
            plan.delete(planData);
        });

        // validate & clean
        after('Validate Migration & clean resources', () => {

            if (['Storage class conversion', 'State migration'].indexOf(`${planData.migration_type}`) > -1) {
                cy.exec(`"${configurationScript}" post_migration_verification_on_target ${planData.namespaceList} ${selectedCluster}`, {timeout: 100000}).then((result) => {
                    log(`'${migrationType}_post_migration_verification_on_target'`, result)
                });
            } else {
                cy.exec(`"${configurationScript}" post_migration_verification_on_target ${planData.namespaceList} ${targetCluster}`, {timeout: 100000}).then((result) => {
                    log(`'${migrationType}_post_migration_verification_on_target'`, result)
                });
                cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} ${sourceCluster}`, {timeout: 100000}).then((result) => {
                    log(`'${migrationType}_cleanup_source_cluster'`, result)
                });
            }
        });
    });
});