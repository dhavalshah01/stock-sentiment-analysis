#!/usr/bin/env bash
# cleanup-demo.sh - Tears down demo-specific resources
# Usage: ./cleanup-demo.sh --resource-group <RG> [--keep-infra]
set -euo pipefail

RESOURCE_GROUP=""
KEEP_INFRA=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    --keep-infra) KEEP_INFRA=true; shift ;;
    --help)
      echo "Usage: $0 --resource-group <RG> [--keep-infra]"
      echo ""
      echo "Options:"
      echo "  --resource-group  Azure resource group containing demo resources"
      echo "  --keep-infra      Keep the core infrastructure, only clean demo data"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$RESOURCE_GROUP" ]]; then
  echo "ERROR: --resource-group is required"
  exit 1
fi

echo "=== Stock Sentiment Analysis - Demo Cleanup ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Keep Infrastructure: $KEEP_INFRA"
echo ""

if [[ "$KEEP_INFRA" == "true" ]]; then
  echo "[1/1] Keeping infrastructure. No demo-specific data to clean."
  echo "NOTE: The application cache will auto-expire within 5 minutes."
  echo "=== Cleanup complete ==="
else
  echo "WARNING: This will delete ALL resources in resource group '$RESOURCE_GROUP'"
  read -p "Are you sure? (yes/no): " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Cancelled."
    exit 0
  fi
  echo "[1/1] Deleting resource group '$RESOURCE_GROUP'..."
  az group delete --name "$RESOURCE_GROUP" --yes --no-wait
  echo "Resource group deletion initiated (running in background)."
  echo "=== Cleanup complete ==="
fi
