# End-to-end Cypress tests for Crane/MTC UI

# Requirements

    1.Operating system

      Fedora 21 and above (64-bit only)

    2.Install Node.js 12 or 14 and above

      sudo dnf install nodejs
      OR
      sudo dnf install npm    # also installs nodejs

    3.Upgrade Node to 12 or 14 or above

      sudo npm install -g n

# Install and run automation
    1.Clone automation repository

      git clone https://github.com/konveyor/crane-ui-tests.git

    2.Go to folder and install

      $ cd crane-ui-tests
      $ npm install
    
    3.Log into the cluster on which Crane/MTC controller has been deployed and obtain Crane/MTC URL.

      [user1@localhost rsync]$ oc get routes -n openshift-migration
      NAME        HOST/PORT                                                                          PATH      SERVICES       PORT        TERMINATION     WILDCARD
      discovery   discovery-openshift-migration.apps.cam-tgt-1122.devcluster.openshift.com             discovery      <all>       edge/Redirect   None
      migration   migration-openshift-migration.apps.cam-tgt-1122.devcluster.openshift.com             migration-ui   port-9000   edge/Redirect   None

    4.Specify Crane/MTC URL and kubeadmin password of the cluster hosting the Crane/MTC controller in the cypress.json file.
      For eg:

      [user1@localhost crane-ui-tests]$ cat cypress.json
      {
        "viewportWidth": 1280,
        "viewportHeight": 800,
        "supportFile": "cypress/support/commands.js",
        "env": {
            "user": "kubeadmin",
            "pass": "password",
            "craneUrl": "https://migration-openshift-migration.apps.cam-tgt-1122.devcluster.openshift.com"
        }
      }
  
    5.Open Cypress and run test cases. For eg: the tests within the login.test.ts file can be run using this command.

      [user1@localhost]$ cd crane-ui-tests
      [user1@localhost crane-ui-tests]$ npx cypress run --browser firefox --spec "./cypress/integration/tests/login.test.ts"
