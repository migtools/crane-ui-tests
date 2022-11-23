import {run_command_oc} from "../../utils/oc_wrapper";
import {generateRandomStringLowerCaseOnly, log, login} from "../../utils/utils";
import {Cluster} from "../models/cluster";
import {Plan} from "../models/plan";
import {PlanData} from "../types/types";

const craneConfigurationScript = "./cypress/utils/crane_configuration_script.sh"
const configurationScript = "./cypress/utils/configuration_script.sh"

const sourceCluster = Cypress.env('sourceCluster');
const targetCluster = Cypress.env('targetCluster');

const plan = new Plan();
const cluster = new Cluster()
const openvpnNamespace = `openvpn-namespace`;
const clusterName = `source-tunnel-${generateRandomStringLowerCaseOnly(3)}`;

// prepare planData for direct and indirect migration
const dataPlans: PlanData[] = [
    {
        name: 'indirect-air-gapped-migration',
        migration_type: 'Full migration',
        source: `${clusterName}`,
        target: 'host',
        repo: 'automatic',
        namespaceList: ['indirect-air-gapped-namespace'],
        directImageMigration: false,
        directPvmigration: false
    },
    {
        name: 'direct-air-gapped-migration',
        migration_type: 'Full migration',
        source: `${clusterName}`,
        target: 'host',
        repo: 'automatic',
        namespaceList: ['direct-air-gapped-namespace'],
        directImageMigration: true,
        directPvmigration: true
    }
]

describe('Setup crane tunnel', () => {

    it('Initialize crane connection', () => {
        run_command_oc('source', 'get proxy -o yaml | grep \'httpProxy\' | head -1').then(($el) => {
            let command: string;
            ($el.stdout == '') ?
                command = `"${craneConfigurationScript}" setup_crane ${openvpnNamespace} ${sourceCluster} ${targetCluster}` :
                command = `"${craneConfigurationScript}" setup_crane ${openvpnNamespace} ${sourceCluster} ${targetCluster} "${$el.stdout.split(": ")[1].trim()}"`
            cy.exec(command, {timeout: 1800000}).then(result => {
                expect(result.stdout).to.contain('SSL Certificate generation complete');
            });
        });
    });

    // login and wait some time
    it('Login', () => {
        login();
    });

    it('Add new tunneled connection cluster', () => {
        run_command_oc('source', "sa get-token -n openshift-migration migration-controller").then(($el) => {
            const url = `https://proxied-cluster.${openvpnNamespace}.svc.cluster.local:8443`
            const registry_path = `proxied-cluster.${openvpnNamespace}.svc.cluster.local:5000`
            const clusterData = {
                name: clusterName,
                url: url,
                token: $el.stdout,
                registryPath: registry_path
            }
            cluster.addCluster(clusterData);
            cluster.close();
        });
    });

    it('Waiting for cluster to be connected', () => {
        cluster.waitForConnected(clusterName);
    });
});

dataPlans.forEach(planData => {
    describe(`${planData.name}`, () => {

        // Setup Clusters
        before('Setup Clusters', () => {
            cy.log("preparing for " + planData.name);
            cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} ${sourceCluster}`, {timeout: 300000}).then((result) => {
                log(`${planData.name}_setup_source_cluster`, result);
            });
            cy.exec(`"${configurationScript}" setup_target_cluster ${planData.namespaceList} ${targetCluster}`, {timeout: 300000}).then((result) => {
                log(`${planData.name}_setup_target_cluster`, result);
            });
        });

        // login
        it('Login', () => {
            login();
        });

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

        // validate & clean
        after('Validate Migration & Clean up resources', () => {
            cy.exec(`"${configurationScript}" post_migration_verification_on_target ${planData.namespaceList} ${targetCluster}`, {timeout: 300000});
            cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} ${sourceCluster}`, {timeout: 300000});
        });

    });
});

describe('Clean crane resources', () => {

    // login to the UI
    it('Login', () => {
        login();
    });
    // remove the cluster
    it('Remove Cluster', () => {
        cluster.removeCluster(clusterName)
    });
    // validate & clean
    it('Remove crane setup', () => {
        cy.exec(`"${craneConfigurationScript}" clean_crane ${sourceCluster} ${targetCluster}`, {timeout: 1800000});
    });
});