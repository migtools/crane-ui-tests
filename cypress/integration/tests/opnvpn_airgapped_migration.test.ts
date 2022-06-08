import { data } from "cypress/types/jquery";
import { run_command_oc } from "../../utils/oc_wrapper";
import { login } from "../../utils/utils";
import { Cluster } from "../models/cluster";
import { Plan } from "../models/plan";
import { PlanData } from "../types/types";

const craneConfigurationScript = "./cypress/utils/crane_configuration_script.sh"
const configurationScript = "./cypress/utils/configuration_script.sh"

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');


describe('openvpn-air-gapped-migration', () => {

    const plan = new Plan();
    const cluster = new Cluster()


    // prepare planData for direct and indirect migration
    let dataPlans: PlanData[] = [
        {
            name: 'indirect-air-gapped-migration',
            migration_type: 'Full migration',
            source: 'vpn-tunnel-source',
            target: 'host',
            repo: 'automatic',
            namespaceList: ['indirect-air-gapped-namespace'],
            directImageMigration: false,
            directPvmigration: false
        },
        {
            name: 'direct-air-gapped-migration',
            migration_type: 'Full migration',
            source: 'vpn-tunnel-source',
            target: 'host',
            repo: 'automatic',
            namespaceList: ['direct-air-gapped-namespace'],
            directImageMigration: true,
            directPvmigration: true
        }
    ]

    // prepare
    before('Prepare cluster', () => {
        // get proxy details and run command accordingly
        run_command_oc('source', 'get proxy -o yaml | grep \'httpProxy\' | head -1').then(($el) => {
            let proxy_str = '';
            ($el.stdout == '') ? proxy_str = '' : proxy_str = $el.stdout.split(": ")[1].trim()
            cy.exec(`"${craneConfigurationScript}" setup_crane ${sourceCluster} ${targetCluster} "${proxy_str}"`, { timeout: 1800000 })
                .its('stdout')
                .should('contain', 'SSL Certificate generation complete');
        });

        // prepare the namespaces for each plan data
        dataPlans.forEach((planData) => {
            cy.log("preparing for " + planData.name);
            cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} ${sourceCluster}`, { timeout: 300000 });
            cy.exec(`"${configurationScript}" setup_target_cluster ${planData.namespaceList} ${targetCluster}`, { timeout: 300000 });
        });
    });

    // login and wait some time
    it('Login', () => {
        login();
        cy.wait(600000);
    });

    // add new cluster
    it('Add new cluster', () => {
        run_command_oc('source', "sa get-token -n openshift-migration migration-controller").then(($el) => {
            const url = 'https://proxied-cluster.openvpn-tunnel-namespace.svc.cluster.local:8443'
            const registry_path = 'proxied-cluster.openvpn-tunnel-namespace.svc.cluster.local:5000'
            const clusterData = {
                name: 'vpn-tunnel-source',
                url: url,
                token: $el.stdout,
                registryPath: registry_path
            }
            cluster.addCluster(clusterData);
            cluster.close();
        });
    });

    // create migplan and execute it, then delete for each planData
    dataPlans.forEach((planData) => {
        // create new migplan
        it(`'Create ${planData.name} migration plan'`, () => {
            plan.create(planData);
        });

        // execute migplan
        it(`'Execute ${planData.name} migration plan'`, () => {
            plan.execute(planData);
        });

        // delete migplan
        it(`'Delete ${planData.name} migration plan'`, () => {
            plan.delete(planData);
        });
    });

    // validate & clean
    after('Validate Migration & Clean up resources', () => {
        // for each planData validate the migration and clean the namespaces afterwards
        dataPlans.forEach((planData) => {
            cy.exec(`"${configurationScript}" post_migration_verification_on_target ${planData.namespaceList} ${targetCluster}`, { timeout: 300000 });
            cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} ${sourceCluster}`, { timeout: 300000 });
        });
        cy.exec(`"${craneConfigurationScript}" clean_crane ${sourceCluster} ${targetCluster}`, { timeout: 1800000 });
    });
});