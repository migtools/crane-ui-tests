import {noVerifyCopyPlanData, verifyCopyPlanData, directPvPlanData} from './cluster_config';
import {login} from '../../utils/utils';
import {Plan} from '../models/plan'
import {PlanData} from "../types/types";
import {run_command_oc} from "../../utils/oc_wrapper";

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');
const configurationScript = "./cypress/utils/configuration_script.sh"

describe('Automate deletion of multiple migration plans', () => {
    const plan = new Plan();

    const selectorTuple: [PlanData, string][] = [
        [directPvPlanData, 'Direct PV migration with copy verification'],
        [noVerifyCopyPlanData, 'Indirect migration without copy verification'],
        [verifyCopyPlanData, 'Indirect migration with copy verification'],
    ];

    // login to the application
    it("Login", () => {
        login();
    });

    selectorTuple.forEach(($type) => {
        const [planData, migrationType] = $type;
        // setup source cluster
        it(`setup source cluster_${migrationType}`, () => {
            cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} "${sourceCluster}"`, {timeout: 200000});
            cy.exec(`"${configurationScript}" setup_target_cluster ${planData.namespaceList} "${targetCluster}"`, {timeout: 200000});
        });
    });

    selectorTuple.forEach(($type) => {
        const [planData, migrationType] = $type;
        // create migration plans
        it(`Create migplan_${migrationType}`, () => {
            plan.create(planData);
        });
    });

    // trigger a delete action for the created migplans
    selectorTuple.forEach(($type) => {
        const [planData, migrationType] = $type;
        it(`Delete migplan_${migrationType}`, () => {
            plan.delete(planData);
        });
    });

    // wait sometime before checking for deleted migplans
    it('wait 30 seconds', () => {
        cy.wait(30000);
    });

    // check if the migplan is deleted
    it('Assert all migplans are deleted', () => {
        run_command_oc('target', ' -n openshift-migration get migplan | wc -l').its('stdout').should('eq', '0')
    });

    // clean the resources
    selectorTuple.forEach(($type) => {
        const [planData, migrationType] = $type;
        // clean migplans
        it(`${migrationType}`, () => {
            cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} "${sourceCluster}"`, {timeout: 100000});
        });
    });
});
