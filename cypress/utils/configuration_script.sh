NAMESPACE=$2
NAMESPACE_LIST="$(echo -e "$NAMESPACE" | sed 's/,/ /g')"
CLUSTER_LOGIN_STRING=$3

setup_source_cluster() {
  #This function creates a new project and application for migration on source cluster.
  $CLUSTER_LOGIN_STRING
  for i in $NAMESPACE_LIST; do
    if (oc get project $i 2>/dev/null); then
      oc delete project $i
    fi
    while (oc get project $i 2>/dev/null); do
      sleep 5
    done
    oc new-project $i
    sleep 3
    oc new-app django-psql-persistent -n $i
    while [[ $(oc get pods -l deployment=django-psql-persistent-1 -n $i -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}') != "True" ]]; do
      sleep 5
    done
    curl "$(oc get routes -n $i | grep django | awk '{print $2}')"
  done
}

setup_target_cluster() {
  #This function deletes any existing plan(s) and target namespace on the target cluster.
  $CLUSTER_LOGIN_STRING
  for i in $NAMESPACE_LIST; do
    if (oc get project $i 2>/dev/null); then
      oc delete project $i
    fi
    while (oc get project $i 2>/dev/null); do
      sleep 5
    done
  done
  oc delete migplan --all -n openshift-migration
}

cleanup_source_cluster() {
  #This function cleans up the source cluster by deleting the application created for migration.
  $CLUSTER_LOGIN_STRING
  for i in $NAMESPACE_LIST; do
    if (oc get project $i 2>/dev/null); then
      oc delete project $i
    fi
    while (oc get project $i 2>/dev/null); do
      sleep 5
    done
  done
}

post_migration_verification_on_target() {
  #This function verifies that the migrated application is running fine on the target cluster.
  $CLUSTER_LOGIN_STRING
  for i in $NAMESPACE_LIST; do
    if (oc get routes -n $i | grep django 2>/dev/null); then
      curl "$(oc get routes -n i | grep django | awk '{print $2}')"
    fi
    if (oc get project $i 2>/dev/null); then
      oc delete project $i
    fi
    while (oc get project $i 2>/dev/null); do
      sleep 5
    done
  done
}

if [ $1 == "setup_source_cluster" ]; then
  setup_source_cluster "$NAMESPACE" "$CLUSTER_LOGIN_STRING"
elif [ $1 == "setup_target_cluster" ]; then
  setup_target_cluster "$NAMESPACE" "$CLUSTER_LOGIN_STRING"
elif [ $1 == "cleanup_source_cluster" ]; then
  cleanup_source_cluster "$CLUSTER_LOGIN_STRING" "$NAMESPACE"
elif [ $1 == "post_migration_verification_on_target" ]; then
  post_migration_verification_on_target "$CLUSTER_LOGIN_STRING" "$NAMESPACE"
fi
