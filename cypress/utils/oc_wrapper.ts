import {PlanData} from "../integration/types/types";

const sourceLoginString = Cypress.env('sourceCluster').replaceAll('"', '')
const targetLoginString = Cypress.env('targetCluster').replaceAll('"', '')


//Backend Utils

export function loginToSource(): void {
    cy.log("Logging in to source cluster: " + sourceLoginString)
    cy.exec(sourceLoginString);
    cy.wait(2000)
}

export function loginToTarget(): void {
    cy.log("Logging in to target cluster: " + targetLoginString)
    cy.exec(targetLoginString);
    cy.wait(2000)
}

export function createProject(namespace: string): void {

    cy.exec('oc get project ' + namespace + ' 2>/dev/null', {failOnNonZeroExit: false}).then((result) => {
        if (result.code == 0) {
            deleteProject(namespace);
        }
    });

    cy.exec('oc new-project ' + namespace);
    cy.wait(5000)
}

export function deleteProject(namespace: string): void {
    cy.exec('oc delete project ' + namespace);
    cy.wait(10000)
}

export function create_resource(resource: string): void {
    cy.exec('cat <<EOF | oc create -f -\n' + resource + '\nEOF').then((result) => {
        console.log(result.stderr);
        console.log(result.stdout);
        console.log(result.code);
    });
}

export function run_command_oc(cluster: string, command: string): Cypress.Chainable<undefined> {

    if (cluster == "source") {
        loginToSource();
    } else {
        loginToTarget();
    }
    return cy.exec("oc " + command);
}

export function runCommand(command: string): Cypress.Chainable<undefined> {
    return cy.exec("oc " + command)
}

export function setupSourceCluster(planData: PlanData) {
    loginToSource();
    setUpCLuster(planData);
}

export function setupTargetCluster(planData: PlanData) {
    loginToTarget()
    setUpCLuster(planData);
}

function setUpCLuster(planData: PlanData) {

    // for every namespace delete it if it exists and the create it again
    cleanUpCluster(planData);
    planData.namespaceList.forEach((namespace) => {
        createProject(namespace);
        runCommand(`new-app django-psql-persistent -n ${namespace}`);
        // verify the app is deployed
        // runCommand('oc get pods -l deployment=django-psql-persistent-1 -n $i -o \'jsonpath={..status.conditions[?(@.type=="Ready")].status}')
        //     .its('stdout')
        //     .should('equal', 'True', {timeout: 20000})
    });

}

export function cleanUpSourceCluster(planData: PlanData) {
    loginToSource();
    cleanUpCluster(planData);
}

export function cleanUpTargetCluster(planData: PlanData) {

    loginToTarget();
    cleanUpCluster(planData);
    runCommand('delete migplan --all -n openshift-migration');
}

export function cleanUpCluster(planData: PlanData) {

    // for every namespace delete it if it exists and the create it again
    planData.namespaceList.forEach((namespace) => {
        cy.exec('oc get project ' + namespace + ' 2>/dev/null', {failOnNonZeroExit: false}).then((result) => {
            if (result.code == 0) {
                deleteProject(namespace);
            }
        });
    });
}

export function validateAppMigrationInSourceCluster(planData: PlanData) {

    loginToSource();
    validateAppMigration(planData)

}

export function validateAppMigrationInTargetCluster(planData: PlanData) {

    loginToTarget();
    validateAppMigration(planData)

}

export function validateAppMigration(planData: PlanData) {
    planData.namespaceList.forEach((namespace) => {
        runCommand(`curl \"$(oc get routes -n ${namespace} | grep django | awk '{print $2}')\"`)
            .its('code').should('equal', '0');
    });
}