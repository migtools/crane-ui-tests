import { result } from "cypress/types/lodash";

const sourceCluster = Cypress.env('sourceCluster')
const targetCluster = Cypress.env('targetCluster')


//Backend Utils

export function loginToSource(): void {
    cy.log("Logging in to source cluster: " + sourceCluster)
    cy.exec('oc login ' + sourceCluster + ' --insecure-skip-tls-verify');
    cy.wait(2000)
}
  
export function loginToTarget(): void {
    cy.log("Logging in to target cluster: " + targetCluster)
    cy.exec('oc login ' + targetCluster + ' --insecure-skip-tls-verify');
    cy.wait(2000)
}

export function createProject(namespace: string): void {

    cy.exec('oc get project ' + namespace + ' 2>/dev/null', {failOnNonZeroExit: false}).then((result) => {

        if(result.code == 0){
            deleteProject(namespace);
        }
    })

    cy.exec('oc new-project ' + namespace);
    cy.wait(5000)
}

export function deleteProject(namespace: string): void {
    cy.exec('oc delete project '+ namespace);
    cy.wait(10000)
}

export function create_resource(resource: string): void {
    cy.exec('cat <<EOF | oc create -f -\n' + resource + '\nEOF').then((result) => {
        console.log(result.stderr);
        console.log(result.stdout);
        console.log(result.code);
    });
}

export function run_command_oc(cluster: string, command: string): any {

    if (cluster=="source") {
        loginToSource();
    }
    else {
        loginToTarget();
    }
    
    cy.exec("oc "+ command).then((result)=> {
        return result.stdout
    })

}
  
