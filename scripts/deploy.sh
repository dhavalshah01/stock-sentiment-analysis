#!/usr/bin/env bash
set -euo pipefail

# Stock Sentiment Analysis - Deployment Script
# Idempotent: safe to run multiple times

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Defaults
RESOURCE_GROUP=""
LOCATION="northcentralus"
ENVIRONMENT="dev"
APP_NAME_PREFIX="stocksentiment"
INFRA_ONLY=false
APP_ONLY=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }
ok()    { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $*"; }
err()   { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $*" >&2; }

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Deploy Stock Sentiment Analysis infrastructure and/or application.

Options:
  --resource-group    Azure resource group name (required)
  --location          Azure region (default: northcentralus)
  --environment       Target environment: dev, staging, prod (default: dev)
  --app-name-prefix   Prefix for Azure resource names (default: stocksentiment)
  --infra-only        Deploy only infrastructure (skip app deployment)
  --app-only          Deploy only the application (skip infra deployment)
  --help              Show this help message

Examples:
  $(basename "$0") --resource-group my-rg --environment dev
  $(basename "$0") --resource-group my-rg --environment prod --infra-only
  $(basename "$0") --resource-group my-rg --app-only
EOF
  exit 0
}

check_prerequisites() {
  log "Checking prerequisites..."
  local failed=false

  if ! command -v az &>/dev/null; then
    err "Azure CLI (az) is not installed. Install from https://aka.ms/install-azure-cli"
    failed=true
  else
    ok "Azure CLI found: $(az version --query '"azure-cli"' -o tsv 2>/dev/null || echo 'unknown')"
  fi

  if ! az account show &>/dev/null; then
    err "Not logged in to Azure CLI. Run 'az login' first."
    failed=true
  else
    ok "Azure CLI authenticated as $(az account show --query user.name -o tsv 2>/dev/null)"
  fi

  if ! command -v node &>/dev/null; then
    if [ "$INFRA_ONLY" = false ]; then
      err "Node.js is not installed."
      failed=true
    else
      warn "Node.js not found (not required for --infra-only)"
    fi
  else
    ok "Node.js found: $(node --version)"
  fi

  if ! command -v npm &>/dev/null; then
    if [ "$INFRA_ONLY" = false ]; then
      err "npm is not installed."
      failed=true
    else
      warn "npm not found (not required for --infra-only)"
    fi
  else
    ok "npm found: $(npm --version)"
  fi

  if [ "$failed" = true ]; then
    err "Prerequisite check failed. Resolve the issues above and retry."
    exit 1
  fi

  ok "All prerequisites satisfied"
}

deploy_infra() {
  log "Deploying infrastructure to resource group '${RESOURCE_GROUP}' in '${LOCATION}'..."

  log "Creating/updating resource group..."
  az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --tags project=stock-sentiment-analysis environment="${ENVIRONMENT}" managedBy=script \
    --output none

  ok "Resource group '${RESOURCE_GROUP}' ready"

  log "Deploying Bicep templates (environment: ${ENVIRONMENT})..."
  local deployment_name="deploy-${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"
  local param_file="${PROJECT_ROOT}/infra/parameters/${ENVIRONMENT}.bicepparam"

  if [ ! -f "${param_file}" ]; then
    err "Parameter file not found: ${param_file}"
    exit 1
  fi

  DEPLOYMENT_OUTPUTS=$(az deployment group create \
    --resource-group "${RESOURCE_GROUP}" \
    --template-file "${PROJECT_ROOT}/infra/main.bicep" \
    --parameters "${param_file}" \
    --parameters location="${LOCATION}" \
    --name "${deployment_name}" \
    --query "properties.outputs" \
    --output json)

  ok "Infrastructure deployed successfully"

  WEBAPP_URL=$(echo "${DEPLOYMENT_OUTPUTS}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('webAppUrl',{}).get('value',''))" 2>/dev/null || echo "")
  WEBAPP_NAME="${APP_NAME_PREFIX}-${ENVIRONMENT}-app"

  if [ -n "${WEBAPP_URL}" ]; then
    log "Web App URL: ${WEBAPP_URL}"
  fi
}

deploy_app() {
  local webapp_name="${APP_NAME_PREFIX}-${ENVIRONMENT}-app"
  log "Deploying application to '${webapp_name}'..."

  log "Installing production dependencies..."
  cd "${PROJECT_ROOT}/src"
  npm ci --production --silent 2>/dev/null || npm ci --production

  log "Creating deployment package..."
  local zip_path="${PROJECT_ROOT}/app-package.zip"
  rm -f "${zip_path}"

  cd "${PROJECT_ROOT}/src"
  zip -r "${zip_path}" . \
    -x "*.test.js" "*.spec.js" "__tests__/*" "coverage/*" ".env*" "node_modules/.cache/*" \
    --quiet

  ok "Deployment package created: $(du -h "${zip_path}" | cut -f1)"

  log "Deploying to Azure App Service..."
  az webapp deploy \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${webapp_name}" \
    --src-path "${zip_path}" \
    --type zip \
    --output none

  ok "Application deployed to '${webapp_name}'"

  rm -f "${zip_path}"

  WEBAPP_URL="${WEBAPP_URL:-https://${webapp_name}.azurewebsites.net}"
}

run_smoke_test() {
  local url="${WEBAPP_URL:-https://${APP_NAME_PREFIX}-${ENVIRONMENT}-app.azurewebsites.net}"
  local health_url="${url}/health"
  local max_retries=5
  local retry_delay=10

  log "Running smoke test against ${health_url}..."

  for i in $(seq 1 ${max_retries}); do
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "${health_url}" --max-time 10 2>/dev/null || echo "000")

    if [ "${http_code}" = "200" ]; then
      ok "Smoke test passed (HTTP ${http_code})"
      return 0
    fi

    warn "Attempt ${i}/${max_retries}: HTTP ${http_code} - retrying in ${retry_delay}s..."
    sleep "${retry_delay}"
  done

  err "Smoke test failed after ${max_retries} attempts"
  return 1
}

main() {
  # Parse arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --resource-group)  RESOURCE_GROUP="$2"; shift 2 ;;
      --location)        LOCATION="$2"; shift 2 ;;
      --environment)     ENVIRONMENT="$2"; shift 2 ;;
      --app-name-prefix) APP_NAME_PREFIX="$2"; shift 2 ;;
      --infra-only)      INFRA_ONLY=true; shift ;;
      --app-only)        APP_ONLY=true; shift ;;
      --help)            usage ;;
      *) err "Unknown option: $1"; usage ;;
    esac
  done

  # Validate required args
  if [ -z "${RESOURCE_GROUP}" ]; then
    err "--resource-group is required"
    usage
  fi

  if [[ ! "${ENVIRONMENT}" =~ ^(dev|staging|prod)$ ]]; then
    err "Invalid environment '${ENVIRONMENT}'. Must be dev, staging, or prod."
    exit 1
  fi

  if [ "$INFRA_ONLY" = true ] && [ "$APP_ONLY" = true ]; then
    err "Cannot use both --infra-only and --app-only"
    exit 1
  fi

  echo ""
  log "=========================================="
  log " Stock Sentiment Analysis - Deployment"
  log "=========================================="
  log " Environment:    ${ENVIRONMENT}"
  log " Resource Group: ${RESOURCE_GROUP}"
  log " Location:       ${LOCATION}"
  log " App Prefix:     ${APP_NAME_PREFIX}"
  log "=========================================="
  echo ""

  WEBAPP_URL=""

  check_prerequisites

  if [ "$APP_ONLY" = false ]; then
    deploy_infra
  fi

  if [ "$INFRA_ONLY" = false ]; then
    deploy_app
    run_smoke_test
  fi

  echo ""
  ok "=========================================="
  ok " Deployment complete!"
  ok "=========================================="
  if [ -n "${WEBAPP_URL}" ]; then
    ok " URL: ${WEBAPP_URL}"
  fi
  echo ""
}

main "$@"
