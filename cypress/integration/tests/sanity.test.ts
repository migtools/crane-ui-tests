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
import {login, splitLoginString} from '../../utils/utils';
import {Plan} from '../models/plan'
import {PlanData} from '../types/types';
import {run_command_oc} from "../../utils/oc_wrapper";
import {skipOn} from '@cypress/skip-test'
import {Openshift} from "../../utils/openshift";

const sourceClusterString = Cypress.env('sourceCluster');
const targetClusterString = Cypress.env('targetCluster');

const plan = new Plan();
let targetCluster;
let sourceCluster;

const selectorTuple: [PlanData, string][] = [
    [directImagePlanData, 'Direct image migration without copy verification'],
    // [directPvPlanData, 'Direct PV migration without copy verification'],
    // [verifyCopydirectPvPlan, 'Direct PV migration with copy verification'],
    // [noVerifyCopyPlanData, 'Indirect migration without copy verification'],
    // [verifyCopyPlanData, 'Direct migration with copy verification'],
    // [noVerifyCopyPlanData, 'Rollover indirect migration and then migrate'],
    // [directImagePvPlan, 'Rollover direct migration and then migrate'],
    // [indirectMultipleProjects, 'Indirect migration of multiple projects'],
    // [directMultipleProjects, 'direct migration of multiple projects'],
    // [changeTargetNamespace, 'Direct migration of a single project to non-default target namespace'],
    // [IndirectChangeTargetNamespace, 'Indirect migration of a single project to non-default target namespace'],
    // [directImagePvPlan, 'Direct image and PV migration'],
    // [InterclusterState, 'Inter cluster state migration plan'],
    // [storageClassConversionSource, 'Storage class conversion - Source cluster'],
    // [storageClassConversionTarget, 'Storage class conversion - Target cluster'],
    // [storageClassConversionSource, 'Storage class conversion - Source-Rollover'],
    // [storageClassConversionTarget, 'Storage class conversion - Target-Rollover'],
    // [IntraClusterStateSource, 'Intra cluster state migration - Source cluster'],
    // [IntraClusterStateTarget, 'Intra cluster state migration - Target cluster']
];

selectorTuple.forEach(($type) => {
    const [planData, migrationType] = $type;
    let selectedCluster = null


    describe(`'${migrationType}'`, () => {

        before("Create cluster objects", () => {

            // split the login string for the source and target clusters
            const sourceValues = splitLoginString(sourceClusterString);
            const targetValues = splitLoginString(targetClusterString);

            // initiate source and target clusters objects from Openshift object
            sourceCluster = new Openshift(sourceValues[0], sourceValues[1], sourceValues[2])
            targetCluster = new Openshift(targetValues[0], targetValues[1], targetValues[2])

            // clean all the migration plans before starting
            targetCluster.deleteAllMigrationPlans()

        });

        // if this is a state migraiton or scc, then check there are more than 1 sc available, if not, then skip the test
        if (['Storage class conversion', 'State migration'].indexOf(`${planData.migration_type}`) > -1) {

            (`${planData.source}` == 'source-cluster') ? selectedCluster = sourceCluster : selectedCluster = targetCluster;

            before('Check SC', () => {
                // todo: create a method in the Openshit object to get the storage class count
                if (planData.migration_type == 'Storage class conversion') {
                    run_command_oc((planData.source == 'source-cluster') ? 'source' : 'target', 'get sc | wc -l').then((result) => {
                        let count: number = parseInt(result.stdout)
                        skipOn(count <= 2)
                    });
                }
            });

            it(`Setting up ${( planData.source == 'host' ) ? 'target' : 'source'} cluster`, () => {
                selectedCluster.setupCluster(planData.namespaceList);
            });

        } else {

            it('Setting up source cluster', () => {
                sourceCluster.setupCluster(planData.namespaceList)
            });

            it('Setting up target cluster', () => {
                targetCluster.cleanProjects(planData.namespaceList)
            });

        }

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
                // delete all the projects in the selected cluster
                selectedCluster.cleanProjects(planData.namespaceList);

            } else {
                // assert the application has successfully migrated
                targetCluster.assertAppMigrated(planData.namespaceList)

                // delete all the projects in both clusters
                targetCluster.cleanProjects(planData.namespaceList);
                sourceCluster.cleanProjects(planData.namespaceList);
            }
        });
    });
});