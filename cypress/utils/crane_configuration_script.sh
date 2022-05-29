SRC_CLUSTER=$2
TGT_CLUSTER=$3

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

    source_context=$(oc config current-context)

    oc login ${TGT_CLUSTER} --insecure-skip-tls-verify

    if (oc get project openvpn-tunnel-namespace 2>/dev/null); then
        oc delete project openvpn-tunnel-namespace
        sleep 30
    fi

    destination_context=$(oc config current-context)
    
    ./crane tunnel-api --namespace openvpn-tunnel-namespace --destination-context ${destination_context} --source-context ${source_context}
}

clean_crane() {
    # rm -Rf ./crane_temp
    if (oc get project openvpn-tunnel-namespace 2>/dev/null); then
        oc delete project openvpn-tunnel-namespace
    fi
}

if [ $1 == "setup_crane" ]; then
    setup_crane SRC_CLUSTER TGT_CLUSTER
elif [ $1 == "clean_crane" ]; then
    clean_crane
fi
