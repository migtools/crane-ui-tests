//import { addCluster, button } from '../types/constants';
import {click, clickByText, inputText} from '../../utils/utils';
import {navMenuPoint} from '../views/menu.view';
import {ClusterData} from '../types/types';
import {
    clusterName,
    clusterUrl,
    instanceToken,
    addButtonModal,
    exposedRegistryPath,
    addNewCluster,
    closeWizard,
    status
} from '../views/cluster.view';
import {kebab, kebabDropDownItem} from "../views/plan.view";

export class Cluster {
    protected static openLi(): void {
        //openSidebarMenu();
        clickByText(navMenuPoint, 'Clusters');
    }

    protected openMenu(): void {
        //TODO: replace hardcoded timeout by expecting button to become clickable
        //cy.wait(2000);
        Cluster.openLi();
    }

    addCluster(clusterData: ClusterData): void {
        const {name, url, token, registryPath} = clusterData;
        click(addNewCluster);
        inputText(clusterName, name);
        inputText(clusterUrl, url);
        inputText(instanceToken, token);
        if (registryPath != null) {
            inputText(exposedRegistryPath, registryPath)
        }
        clickByText(addButtonModal, 'Add cluster');
        cy.get('div.pf-l-flex').contains('Connection successful', {timeout: 10000})
    }

    close() {
        clickByText(closeWizard, 'Close');
    }

    removeCluster(clusterName: String) {
        cy.get('td')
            .contains(clusterName)
            .parent('tr')
            .within(() => {
                click(kebab);
            });
        clickByText(kebabDropDownItem, 'Delete');
    }

    waitForConnected(ClusterName: String) {
        cy.get('td')
            .contains(ClusterName, {timeout: 10000})
            .closest('tr')
            .within(() => {
                cy.get(status).contains('Connected', {timeout: 1900000});
            });
    }
}