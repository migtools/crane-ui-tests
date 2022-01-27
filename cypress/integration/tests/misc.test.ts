import { noVerifyCopyPlanData, verifyCopyPlanData, directPvPlanData  } from './cluster_config';
import { login } from '../../utils/utils';
import { Plan } from '../models/plan'
  
const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');
const configurationScript = "./cypress/utils/configuration_script.sh"
  
describe('Automate deletion of multiple migration plans', () => {
    const plan = new Plan();
    
    before("Login", () => {
      login();
    });

    const selectorTuple = [
        [directPvPlanData, 'Direct PV migration with copy verification'],
        [noVerifyCopyPlanData, 'Indirect migration without copy verification'],
        [verifyCopyPlanData, 'Indirect migration with copy verification'],
    ];

    selectorTuple.forEach(($type) => {
        const [Data, migrationType] = $type;
        
        it(`${migrationType}`, () => {
            cy.exec(`"${configurationScript}" setup_source_cluster ${Data.namespaceList} "${sourceCluster}"`, { timeout: 200000 });
            cy.exec(`"${configurationScript}" setup_target_cluster ${Data.namespaceList} "${targetCluster}"`, { timeout: 200000 });
            plan.create(Data);
            plan.delete(Data);
            cy.exec(`"${configurationScript}" post_migration_verification_on_target ${Data.namespaceList} "${targetCluster}"`, { timeout: 100000 });
            cy.exec(`"${configurationScript}" cleanup_source_cluster ${Data.namespaceList} "${sourceCluster}"`, { timeout: 100000 });
        });
    });
})
