#!/bin/bash
export KUBE_NAMESPACE=asl-dev
export KUBE_SERVER=${KUBE_SERVER}
export KUBE_TOKEN=${KUBE_TOKEN}

export SERVICE_NAME=inspector-api

kd --insecure-skip-tls-verify \
  -f deploy/app-deployment.yaml \
  -f deploy/app-service.yaml \
  -f deploy/app-ingress.yaml \
  -f deploy/network-policy.yaml