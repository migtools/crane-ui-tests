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

    before('Setting up the source cluster', () => {
        cy.exec(`"${craneConfigurationScript}" setup_crane "${sourceCluster}" "${targetCluster}"`, { timeout: 600000 })
            .its('stdout')
            .should('contain', 'SSL Certificate generation complete');
        cy.exec(`"${configurationScript}" setup_source_cluster ${planData.namespaceList} "${sourceCluster}"`, { timeout: 200000 });
        cy.exec(`"${configurationScript}" setup_target_cluster ${planData.namespaceList} "${targetCluster}"`, { timeout: 200000 });
    });

    it('Login', () => {
        login()
    });

    it('Add new cluster', () => {

        let SAToken = run_command_oc('source', "sa get-token -n openshift-migration migration-controller");
        let url = 'https://proxied-cluster.openvpn-311.svc.cluster.local:8443'
        let registryPath = 'proxied-cluster.openvpn-311.svc.cluster.local:5000'

        let clusterData = {
            name: 'vpn-tunnel-source',
            url: url,
            token: SAToken,
            registryPath: registryPath
        }

        cluster.addCluster(clusterData)

    });
    debugger

    it('create migration plan', () => {
        plan.create(planData);
    });

    it('Executing migration plan', () => {
        plan.execute(planData);
    });

    after('Validating Migration & Cleaning up', () => {
        cy.exec(`"${configurationScript}" post_migration_verification_on_target ${planData.namespaceList} "${targetCluster}"`, { timeout: 100000 });
        cy.exec(`"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} "${sourceCluster}"`, { timeout: 100000 });
        cy.exec(`"${craneConfigurationScript}" clean_crane`);
    });

});