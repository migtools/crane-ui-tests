SOURCE_LOGIN_STRING=$2
TARGET_LOGIN_STRING=$3
PROXY_STR=$4
NAMESPACE="openvpn-tunnel-namespace"

setup_crane() {

  ${SOURCE_LOGIN_STRING}

  if (oc get project ${NAMESPACE} 2>/dev/null); then
    oc delete project ${NAMESPACE}
    while [[ $(oc get project ${NAMESPACE} 2>/dev/null) ]]; do
      sleep 5
    done
  fi

  SOURCE_CONTEXT=$(oc config current-context)

  ${TARGET_LOGIN_STRING}

  if (oc get project ${NAMESPACE} 2>/dev/null); then
    oc delete project ${NAMESPACE}
    while [[ $(oc get project ${NAMESPACE} 2>/dev/null) ]]; do
      sleep 5
    done
  fi

  # mkdir crane_temp
  # shellcheck disable=SC2164
  cd ./crane_temp
  chmod +x ./crane

  DESTINATION_CONTEXT=$(oc config current-context)

  if [[ $PROXY_STR == "" ]]; then
    ./crane tunnel-api --namespace ${NAMESPACE} --destination-context "${DESTINATION_CONTEXT}" --source-context "${SOURCE_CONTEXT}"
  else

    PROXY_USER="$(cut -d':' -f2 <<<"$PROXY_STR" | cut -d'/' -f3)"
    PROXY_PASS="$(cut -d'@' -f1 <<<"$PROXY_STR" | cut -d':' -f3)"
    PROXY_HOST="$(cut -d'@' -f2 <<<"$PROXY_STR" | cut -d':' -f1)"
    PROXY_PORT="$(cut -d'@' -f2 <<<"$PROXY_STR" | cut -d':' -f2)"

    # shellcheck disable=SC2086
    ./crane tunnel-api --namespace ${NAMESPACE} --destination-context "${DESTINATION_CONTEXT}" --source-context ${SOURCE_CONTEXT} --proxy-host ${PROXY_HOST} --proxy-port ${PROXY_PORT} --proxy-user ${PROXY_USER} --proxy-pass ${PROXY_PASS}
  fi

}

clean_crane() {

  ${SOURCE_LOGIN_STRING}

  if (oc get project ${NAMESPACE} 2>/dev/null); then
    oc delete project ${NAMESPACE}
    while [[ $(oc get project ${NAMESPACE} 2>/dev/null) ]]; do
      sleep 5
    done
  fi

  ${TARGET_LOGIN_STRING}

  if (oc get project ${NAMESPACE} 2>/dev/null); then
    oc delete project ${NAMESPACE}
    while [[ $(oc get project ${NAMESPACE} 2>/dev/null) ]]; do
      sleep 5
    done
  fi
}

if [[ $1 == "setup_crane" ]]; then
  setup_crane SOURCE_LOGIN_STRING TARGET_LOGIN_STRING PROXY_STR
elif [[ $1 == "clean_crane" ]]; then
  clean_crane
fi
