import { directImagePlanData } from './cluster_config';
import { login } from '../../utils/utils';
import { Plan } from '../models/plan'
import { PlanData } from '../types/types';

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');
const configurationScript = "./cypress/utils/configuration_script.sh"

const plan = new Plan();

const selectorTuple: [PlanData, String][] = [
  [directImagePlanData, 'Direct image migration without copy verification'],
  // [directPvPlanData, 'Direct PV migration without copy verification'],
  // [verifyCopydirectPvPlan, 'Direct PV migration with copy verification'],
  // [noVerifyCopyPlanData, 'Indirect migration without copy verification'],
  // [verifyCopyPlanData, 'Direct migration with copy verification'],
  // [noVerifyCopyPlanData, 'Rollover indirect migration and then migrate'],
  // [directImagePvPlan, 'Rollover direct migration and then migrate'],
  // [indirectMultipleProjects, 'Indirect migration of multiple projects'],
  // [directMultipleProjects, 'Indirect migration of multiple projects'],
  // [changeTargetNamespace, 'Direct migration of a single project to non-default target namespace'],
  // [IndirectChangeTargetNamespace, 'Indirect migration of a single project to non-default target namespace'],
  // [directImagePvPlan, 'Direct image and PV migration'],
  // [InterclusterState, 'Inter cluster state migration plan'],
  // [storageClassConversionSource, 'Storage class conversion - Source cluster'],
  // [storageClassConversionTarget, 'Storage class conversion - Target cluster'],
  // [storageClassConversionSource, 'Storage class conversion - Source-Rollover'],
  // [storageClassConversionTarget, 'Storage class conversion - Target-Rollover']
];

selectorTuple.forEach(($type) => {
  const [planData, migrationType] = $type;
  let scc_cluster = null

  describe(`'${migrationType}'`, () => {

    // login
    it('Login', () => {
      login();
    });

    // run before the test run
    before('Setting up Clusters', () => {
      if (`${planData.migration_type}` == 'Storage class conversion') {

        (`${planData.source}` == 'source-cluster') ? scc_cluster = sourceCluster : scc_cluster = targetCluster

        cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} "${scc_cluster}"`, { timeout: 200000 });
      }
      else {
        cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} "${sourceCluster}"`, { timeout: 200000 });
        cy.exec(`"${configurationScript}" setup_target_cluster ${planData.namespaceList} "${targetCluster}"`, { timeout: 200000 });
      }
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
      it('Executing Rollback', () => {
        plan.rollback(planData);
        plan.execute(planData);
      });
    }

    // validate & clean
    after('Validate Migration & clean resources', () => {
      plan.delete(planData);

      if (`${planData.migration_type}` == 'Storage class conversion') {
        cy.exec(`"${configurationScript}" post_migration_verification_on_target ${planData.namespaceList} "${targetCluster}"`, { timeout: 100000 });
      }
      else {
        cy.exec(`"${configurationScript}" post_migration_verification_on_target ${planData.namespaceList} "${targetCluster}"`, { timeout: 100000 });
        cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} "${sourceCluster}"`, { timeout: 100000 });
      }
    });
  });
});