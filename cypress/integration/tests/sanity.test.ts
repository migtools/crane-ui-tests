import { noVerifyCopyPlanData, verifyCopyPlanData, directPvPlanData, verifyCopydirectPvPlan,
  directImagePlanData, directImagePvPlan, indirectMultipleProjects, directMultipleProjects, changeTargetNamespace,
  IndirectChangeTargetNamespace, storageClassConversionSource, storageClassConversionTarget, InterclusterState } from './cluster_config';
import { login } from '../../utils/utils';
import { Plan } from '../models/plan'

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');
const configurationScript = "./cypress/utils/configuration_script.sh"

describe('Automated tests to do direct and indirect migrations and Basic Pipeline Status Verification', () => {
  const plan = new Plan();
  const selectorTuple = [
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
    const [Data, migrationType] = $type;

    it(`${migrationType}`, () => {
      login();
      if (`${Data.migration_type}` == 'Storage class conversion') {
        if (`${Data.source}` == 'source-cluster') {
          const scc_cluster = sourceCluster
        }
        else {
            const scc_cluster = targetCluster
        }
        cy.exec(`"${configurationScript}" setup_source_cluster ${Data.namespaceList} "${scc_cluster}"`, { timeout: 200000 });
      }
      else {
        cy.exec(`"${configurationScript}" setup_source_cluster ${Data.namespaceList} "${sourceCluster}"`, { timeout: 200000 });
        cy.exec(`"${configurationScript}" setup_target_cluster ${Data.namespaceList} "${targetCluster}"`, { timeout: 200000 });
      }
      plan.create(Data);
      plan.execute(Data);

      if (`${migrationType}`.includes('Rollover')) {
        plan.rollback(Data);
        plan.execute(Data);
      }

      if (`${migrationType}` == 'Direct image and PV migration') {
        plan.pipelineStatus(migrationType, Data);
      }
      plan.delete(Data);
  
      if (`${Data.migration_type}` == 'Storage class conversion') {
        cy.exec(`"${configurationScript}" post_migration_verification_on_target ${Data.namespaceList} "${targetCluster}"`, { timeout: 100000 });
      }
      else {
        cy.exec(`"${configurationScript}" post_migration_verification_on_target ${Data.namespaceList} "${targetCluster}"`, { timeout: 100000 });
        cy.exec(`"${configurationScript}" cleanup_source_cluster ${Data.namespaceList} "${sourceCluster}"`, { timeout: 100000 });
      }
    })
  });
})
