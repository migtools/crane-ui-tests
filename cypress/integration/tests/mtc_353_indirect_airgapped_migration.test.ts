import { data } from "cypress/types/jquery";
import { run_command_oc } from "../../utils/oc_wrapper";
import { login } from "../../utils/utils";
import { Cluster } from "../models/cluster";
import { Plan } from "../models/plan";

const craneConfigurationScript = "./cypress/utils/crane_configuration_script.sh"
const configurationScript = "./cypress/utils/configuration_script.sh"

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');


describe('mtc-353-indirect-air-gapped-migration', () => {

    const plan = new Plan();
    const cluster = new Cluster()

    let planData = {
        name: 'indirect-air-gapped-migration',
        migration_type: 'Full migration',
        source: 'vpn-tunnel-source',
        target: 'host',
        repo: 'automatic',
        namespaceList: ['indirect-air-gapped-namespace'],
        directImageMigration: false,
        directPvmigration: false,
    }

    // prepare
    before('Prepare cluster', () => {

        run_command_oc('source', 'get proxy -o yaml | grep \'httpProxy\' | head -1').then(($el) => {

            let proxy_str = '';

            ($el.stdout == '') ? proxy_str = '' : proxy_str = $el.stdout.split(": ")[1].trim()

            cy.exec(`"${craneConfigurationScript}" setup_crane ${sourceCluster} ${targetCluster} "${proxy_str}"`, { timeout: 1800000 })
                .its('stdout')
                .should('contain', 'SSL Certificate generation complete');
        });

        cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} ${sourceCluster}`, { timeout: 200000 });
        cy.exec(`"${configurationScript}" setup_target_cluster ${planData.namespaceList} ${targetCluster}`, { timeout: 200000 });
    });

    // login
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

    // create new migplan
    it('Create migration plan', () => {
        plan.create(planData);
    });

    // execute migplan
    it('Execute migration plan', () => {
        plan.execute(planData);
    });

    // validate & clean
    after('Validate Migration & Clean up resources', () => {
        cy.exec(`"${configurationScript}" post_migration_verification_on_target ${planData.namespaceList} ${targetCluster}`, { timeout: 100000 });
        cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} ${sourceCluster}`, { timeout: 100000 });
        cy.exec(`"${craneConfigurationScript}" clean_crane ${sourceCluster} ${targetCluster}`, {timeout: 1800000});
    });
});