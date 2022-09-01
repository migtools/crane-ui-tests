import {
    changeTargetNamespace,
    directImagePlanData,
    directImagePvPlan,
    directMultipleProjects,
    directPvPlanData,
    IndirectChangeTargetNamespace,
    indirectMultipleProjects,
    InterclusterState,
    noVerifyCopyPlanData,
    storageClassConversionSource,
    storageClassConversionTarget,
    verifyCopydirectPvPlan,
    verifyCopyPlanData,
    IntraClusterStateSource,
    IntraClusterStateTarget
} from './cluster_config';
import {login} from '../../utils/utils';
import {Plan} from '../models/plan'
import {PlanData} from '../types/types';
import {
    cleanUpCluster,
    cleanUpSourceCluster, cleanUpTargetCluster,
    run_command_oc,
    setupSourceCluster,
    setupTargetCluster, validateAppMigrationInSourceCluster, validateAppMigrationInTargetCluster
} from "../../utils/oc_wrapper";
import {skipOn} from '@cypress/skip-test'

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');

const plan = new Plan();

const selectorTuple: [PlanData, string][] = [
    [directImagePlanData, 'Direct image migration without copy verification'],
    [directPvPlanData, 'Direct PV migration without copy verification'],
    [verifyCopydirectPvPlan, 'Direct PV migration with copy verification'],
    [noVerifyCopyPlanData, 'Indirect migration without copy verification'],
    [verifyCopyPlanData, 'Direct migration with copy verification'],
    [noVerifyCopyPlanData, 'Rollover indirect migration and then migrate'],
    [directImagePvPlan, 'Rollover direct migration and then migrate'],
    [indirectMultipleProjects, 'Indirect migration of multiple projects'],
    [directMultipleProjects, 'direct migration of multiple projects'],
    [changeTargetNamespace, 'Direct migration of a single project to non-default target namespace'],
    [IndirectChangeTargetNamespace, 'Indirect migration of a single project to non-default target namespace'],
    [directImagePvPlan, 'Direct image and PV migration'],
    [InterclusterState, 'Inter cluster state migration plan'],
    [storageClassConversionSource, 'Storage class conversion - Source cluster'],
    [storageClassConversionTarget, 'Storage class conversion - Target cluster'],
    [storageClassConversionSource, 'Storage class conversion - Source-Rollover'],
    [storageClassConversionTarget, 'Storage class conversion - Target-Rollover'],
    [IntraClusterStateSource, 'Intra cluster state migration - Source cluster'],
    [IntraClusterStateTarget, 'Intra cluster state migration - Target cluster']
];

selectorTuple.forEach(($type) => {
    const [planData, migrationType] = $type;
    let selectedCluster = (`${planData.source}` == 'source-cluster') ? selectedCluster = sourceCluster : selectedCluster = targetCluster;

    describe(`'${migrationType}'`, () => {

        // if this is a state migraiton or scc, then check there are more than 1 sc available, if not, then skip the test
        if (['Storage class conversion', 'State migration'].indexOf(`${planData.migration_type}`) > -1) {

            before('Check SC', () => {

                if (planData.migration_type == 'Storage class conversion') {
                    run_command_oc((planData.source == 'source-cluster') ? 'source' : 'target', 'get sc | wc -l').then((result) => {
                        let count: number = result.stdout
                        skipOn(count <= 2)
                    });
                }
            });
        }

        // run before the all coming tests
        it('Setting up Clusters', () => {
            // cy.wait(10000)
            if (['Storage class conversion', 'State migration'].indexOf(`${planData.migration_type}`) > -1) {
                selectedCluster == sourceCluster ? setupSourceCluster(planData) : setupTargetCluster(planData);
            } else {
                setupSourceCluster(planData);
                cleanUpCluster(planData);
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

        // execute rollback if requried
        if (`${migrationType}`.indexOf('Rollover') >= 0) {
            it('Execute Rollback', () => {
                plan.rollback(planData);
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
                selectedCluster == sourceCluster ? validateAppMigrationInSourceCluster(planData) : validateAppMigrationInTargetCluster(planData);
                selectedCluster == sourceCluster ? cleanUpSourceCluster(planData) : cleanUpTargetCluster(planData);
            } else {
                validateAppMigrationInTargetCluster(planData);
                cleanUpSourceCluster(planData);
                cleanUpTargetCluster(planData);
            }
        });
    });
});