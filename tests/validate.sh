#!/usr/bin/env bash
set -euo pipefail

# Stock Sentiment Analysis - Validation Script
# Runs all checks and reports a summary

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

LIVE=false
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
RESULTS=()

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[validate]${NC} $*"; }
pass() { PASS_COUNT=$((PASS_COUNT + 1)); RESULTS+=("${GREEN}✓ PASS${NC}: $1"); echo -e "${GREEN}✓ PASS${NC}: $1"; }
fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); RESULTS+=("${RED}✗ FAIL${NC}: $1"); echo -e "${RED}✗ FAIL${NC}: $1"; }
skip() { SKIP_COUNT=$((SKIP_COUNT + 1)); RESULTS+=("${YELLOW}⊘ SKIP${NC}: $1"); echo -e "${YELLOW}⊘ SKIP${NC}: $1"; }

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --live) LIVE=true; shift ;;
    --help)
      echo "Usage: $(basename "$0") [--live]"
      echo "  --live   Run smoke tests (requires SMOKE_TEST_URL env var)"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

check_prereqs() {
  log "Checking prerequisites..."

  if command -v node &>/dev/null; then
    pass "Node.js installed ($(node --version))"
  else
    fail "Node.js not installed"
  fi

  if command -v npm &>/dev/null; then
    pass "npm installed ($(npm --version))"
  else
    fail "npm not installed"
  fi

  if command -v az &>/dev/null; then
    pass "Azure CLI installed ($(az version --query '"azure-cli"' -o tsv 2>/dev/null || echo 'unknown'))"
  else
    fail "Azure CLI not installed"
  fi
}

validate_infra() {
  log "Validating infrastructure templates..."

  local bicep_file="${PROJECT_ROOT}/infra/main.bicep"
  if [ ! -f "${bicep_file}" ]; then
    fail "Bicep template not found: infra/main.bicep"
    return
  fi

  if ! command -v az &>/dev/null; then
    skip "Infrastructure validation (Azure CLI not available)"
    return
  fi

  if az bicep build --file "${bicep_file}" --stdout >/dev/null 2>&1; then
    pass "Bicep template compiles successfully"
  else
    fail "Bicep template compilation failed"
  fi

  # Validate parameter files exist
  for env in dev staging prod; do
    local param_file="${PROJECT_ROOT}/infra/parameters/${env}.bicepparam"
    if [ -f "${param_file}" ]; then
      pass "Parameter file exists: ${env}.bicepparam"
    else
      fail "Parameter file missing: ${env}.bicepparam"
    fi
  done
}

run_unit_tests() {
  log "Running unit tests..."

  local src_dir="${PROJECT_ROOT}/src"
  if [ ! -f "${src_dir}/package.json" ]; then
    skip "Unit tests (src/package.json not found)"
    return
  fi

  cd "${src_dir}"

  if npm ci --silent 2>/dev/null || npm install --silent 2>/dev/null; then
    pass "npm dependencies installed"
  else
    fail "npm dependency installation failed"
    return
  fi

  if npx jest --config "${PROJECT_ROOT}/tests/jest.config.js" --passWithNoTests 2>&1; then
    pass "Unit tests passed"
  else
    fail "Unit tests failed"
  fi

  cd "${PROJECT_ROOT}"
}

run_smoke_tests() {
  if [ "${LIVE}" != true ]; then
    skip "Smoke tests (use --live to enable)"
    return
  fi

  if [ -z "${SMOKE_TEST_URL:-}" ]; then
    fail "Smoke tests require SMOKE_TEST_URL environment variable"
    return
  fi

  log "Running smoke tests against ${SMOKE_TEST_URL}..."

  local health_url="${SMOKE_TEST_URL}/health"
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "${health_url}" --max-time 10 2>/dev/null || echo "000")

  if [ "${http_code}" = "200" ]; then
    pass "Health endpoint returned HTTP 200"
  else
    fail "Health endpoint returned HTTP ${http_code}"
  fi
}

print_summary() {
  local total=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))

  echo ""
  echo -e "${BLUE}=========================================${NC}"
  echo -e "${BLUE}         Validation Summary${NC}"
  echo -e "${BLUE}=========================================${NC}"
  echo ""

  for result in "${RESULTS[@]}"; do
    echo -e "  ${result}"
  done

  echo ""
  echo -e "${BLUE}-----------------------------------------${NC}"
  echo -e "  Total:   ${total}"
  echo -e "  ${GREEN}Passed:  ${PASS_COUNT}${NC}"
  echo -e "  ${RED}Failed:  ${FAIL_COUNT}${NC}"
  echo -e "  ${YELLOW}Skipped: ${SKIP_COUNT}${NC}"
  echo -e "${BLUE}-----------------------------------------${NC}"

  if [ "${FAIL_COUNT}" -gt 0 ]; then
    echo -e ""
    echo -e "  ${RED}RESULT: FAIL${NC}"
    echo ""
    return 1
  else
    echo -e ""
    echo -e "  ${GREEN}RESULT: PASS${NC}"
    echo ""
    return 0
  fi
}

# Main
log "Starting validation for Stock Sentiment Analysis"
echo ""

check_prereqs
echo ""

validate_infra
echo ""

run_unit_tests
echo ""

run_smoke_tests
echo ""

print_summary
