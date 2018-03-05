#!/bin/bash
export KUBE_NAMESPACE=asl-dev
export KUBE_SERVER=${KUBE_SERVER}
export KUBE_TOKEN=${KUBE_TOKEN}

export SERVICE_NAME=inspector-api

kd --insecure-skip-tls-verify \
  -f deploy/deployment.yaml \
  -f deploy/service.yaml \
  -f deploy/ingress.yaml \
  -f deploy/network-policy.yaml