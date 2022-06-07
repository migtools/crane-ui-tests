SRC_CLUSTER=$2
TGT_CLUSTER=$3
PROXY_STR=$4

setup_crane() {

    # if [ -d ./crane_temp ]; then
    #     rm -Rf ./crane_temp
    # fi

    oc login ${SRC_CLUSTER} --insecure-skip-tls-verify

    if (oc get project openvpn-tunnel-namespace 2>/dev/null); then
        oc delete project openvpn-tunnel-namespace
        sleep 30
    fi

    # mkdir crane_temp
    cd ./crane_temp
    # curl -sL https://api.github.com/repos/konveyor/crane/releases/latest | jq -r ".assets[] | select(.name | contains(\"amd64-linux\")) | .browser_download_url" | wget -i-
    # cp *-crane-* crane
    chmod +x ./crane

    SOURCE_CONTEXT=$(oc config current-context)

    oc login ${TGT_CLUSTER} --insecure-skip-tls-verify

    if (oc get project openvpn-tunnel-namespace 2>/dev/null); then
        oc delete project openvpn-tunnel-namespace
        sleep 30
    fi

    DESTINATION_CONTEXT=$(oc config current-context)

    if [[ $PROXY_STR == "" ]]; then
        ./crane tunnel-api --namespace openvpn-tunnel-namespace --destination-context ${DESTINATION_CONTEXT} --source-context ${SOURCE_CONTEXT}
    else

        PROXY_USER = "$(cut -d':' -f2 <<<"$PROXY_STR" | cut -d'/' -f3)"
        PROXY_PASS = "$(cut -d'@' -f1 <<<"$PROXY_STR" | cut -d':' -f3)"
        PROXY_HOST = "$(cut -d'@' -f2 <<<"$PROXY_STR" | cut -d':' -f1)"
        PROXY_PORT = "$(cut -d'@' -f2 <<<"$PROXY_STR" | cut -d':' -f2)"

        ./crane tunnel-api --namespace openvpn-tunnel-namespace --destination-context ${DESTINATION_CONTEXT} --source-context ${SOURCE_CONTEXT} --proxy-host ${PROXY_HOST} --proxy-port ${PROXY_PORT} --proxy-user ${PROXY_USER} --proxy-pass ${PROXY_PASS}
    fi

}

clean_crane() {
    # rm -Rf ./crane_temp

    oc login ${SRC_CLUSTER} --insecure-skip-tls-verify

    if (oc get project openvpn-tunnel-namespace 2>/dev/null); then
        oc delete project openvpn-tunnel-namespace
        sleep 30
    fi

    oc login ${TGT_CLUSTER} --insecure-skip-tls-verify

    if (oc get project openvpn-tunnel-namespace 2>/dev/null); then
        oc delete project openvpn-tunnel-namespace
        sleep 30
    fi
}

if [ $1 == "setup_crane" ]; then
    setup_crane SRC_CLUSTER TGT_CLUSTER
elif [ $1 == "clean_crane" ]; then
    clean_crane
fi
