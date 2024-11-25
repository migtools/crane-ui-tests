import {
    click,
    inputText,
    login,
    navigateToPage,
} from "../../utils/utils";
import {pages} from "../views/enums.view";
import {addNewCluster, clusterName, clusterUrl} from "../views/cluster.view";

describe('mtc-347-check-domain-name', () => {

    let cluster_data = {
        clusterName: "check-domain-name",
        clusterUrl: "https://api.radixcloud.software:6443/"
    }

    it('mtc-347-check-domain-name', () => {
        login();
        navigateToPage(pages.clusters)
        click(addNewCluster);
        inputText(clusterName, cluster_data.clusterName);
        inputText(clusterUrl, cluster_data.clusterUrl);
        cy.get('#url').parent().should("not.contain", "Not a valid URL")
    })
})