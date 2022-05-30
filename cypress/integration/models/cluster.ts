//import { addCluster, button } from '../types/constants';
import { click, clickByText, inputText } from '../../utils/utils';
import { navMenuPoint } from '../views/menu.view';
import { ClusterData } from '../types/types';
import { clusterName, clusterUrl, instanceToken, addButtonModal, exposedRegistryPath, addNewCluster } from '../views/cluster.view';

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
    const { name, url, token, registryPath } = clusterData;
    click(addNewCluster);
    inputText(clusterName, name);
    inputText(clusterUrl, url);
    inputText(instanceToken, token);
    inputText(exposedRegistryPath, registryPath)
    clickByText(addButtonModal, 'Add cluster');
    cy.get('div.pf-l-flex').contains('Connection successful', { timeout: 10000 })
  }

  getAllCLusters(): any {
    cy.get('td[data-label=Name]')
      .then(($els) => {
        // we get a list of jQuery elements
        // let's convert the jQuery object into a plain array
        return (
          Cypress.$.makeArray($els)
            // and extract inner text from each
            .map((el) => el.innerText)
        )
      });
  }
}