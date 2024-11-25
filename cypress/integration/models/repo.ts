import { clickByText, inputText } from '../../utils/utils';
import { navMenuPoint } from '../views/menu.view';
import { RepoData } from '../types/types';
import { storageProvider, repoName, bucketName, bucketRegion, providerKey, providerSecret, dataLabel} from '../views/repo.view';

export class Repo {
  protected static openLi(): void {
    //openSidebarMenu();
    clickByText(navMenuPoint, 'Replication repositories');
  }

  protected openMenu(): void {
    //TODO: replace hardcoded timeout by expecting button to become clickable
    //cy.wait(2000);
    Repo.openLi();
  }

  protected runWizard(repoData: RepoData): void {
    const { type, name, bucket, region, key, secret } = repoData;
    clickByText('button', 'Add replication repository');
    clickByText('button', 'Select a type');
    clickByText(storageProvider, type);
    inputText(repoName, name);
    inputText(bucketName, bucket);
    inputText(bucketRegion, region);
    inputText(providerKey, key);
    inputText(providerSecret, secret);
    clickByText('button', 'Add Repository');
    clickByText('button', 'Close');
  }

  create(repoData: RepoData): void {
    const { name } = repoData;
    this.openMenu();
    this.runWizard(repoData);
    cy.contains(name)
    .parent('tr')
    .within(() => {
      // Validating that provider is in `Ready` state
      cy.get(dataLabel.status, { timeout: 600 * 100 }).should('have.text', 'Connected');
    });
  }
}
