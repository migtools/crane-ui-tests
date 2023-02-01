import { PlanData } from "../types/types";
import { login } from "../../utils/utils";
import { Plan } from "../models/plan";
import { run_command_oc } from "../../utils/oc_wrapper";

const sourceCluster = Cypress.env("sourceCluster");
const targetCluster = Cypress.env("targetCluster");
const configurationScript = "./cypress/utils/configuration_script.sh";

describe("mtc_372_check_pv_after_migration", () => {
  const plan = new Plan();

  const planData: PlanData = {
    name: "mtc-372-check-pv-migplan",
    source: "source-cluster",
    target: "host",
    repo: "automatic",
    migration_type: "Full migration",
    namespaceList: ["mtc-372-check-pv"],
    directImageMigration: false,
    directPvmigration: false,
    verifyCopy: true,
  };

  // setup source cluster
  before("Setup clusters", () => {
    cy.exec(
      `"${configurationScript}" setup_source_cluster "${planData.namespaceList}" ${sourceCluster}`,
      { timeout: 400000 }
    );
    cy.exec(
      `"${configurationScript}" setup_target_cluster "${planData.namespaceList}" ${targetCluster}`,
      { timeout: 400000 }
    );
  });

  // login
  it("Login", () => {
    login();
  });

  // create migplan
  it("Create migplan", () => {
    plan.create(planData);
  });
  // execute migplan
  it("Execute migplan", () => {
    plan.execute(planData);
  });

  // Assert PV annotation exists in the target cluster is the same as in the source cluster
  it("Assert PV annotation exists in the target cluster is the same as in the source cluster", () => {
    run_command_oc(
      "source",
      `get pv $(oc -n ${planData.namespaceList[0]} get pvc | sed -n '/NAME/!p' | awk '{print $3}') -o yaml | grep 'pv.kubernetes.io/provisioned-by:'`
    ).then((sourceResult) => {
      run_command_oc(
        "target",
        `get pv $(oc -n ${planData.namespaceList[0]} get pvc | sed -n '/NAME/!p' | awk '{print $3}') -o yaml | grep 'pv.kubernetes.io/provisioned-by:'`
      )
        .its("stdout")
        .should("equal", sourceResult.stdout);
    });
  });

  // validate & cleanup target cluster
  after("Clean resources", () => {
    cy.exec(
      `"${configurationScript}" cleanup_source_cluster ${planData.namespaceList} ${sourceCluster}`,
      { timeout: 400000 }
    );
  });
});
