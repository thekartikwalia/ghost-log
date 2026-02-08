#!/usr/bin/env bash
# GhostLog backend deploy script for Azure Functions
# Prerequisites: Azure CLI (az), Azure Functions Core Tools (func), Node.js 18+
# 1. az login
# 2. Set AZURE_TABLE_STORAGE_CONNECTION_STRING and GOOGLE_CLIENT_ID in Function App settings
# 3. Create OAuth 2.0 Client ID (Web or Chrome app) in Google Cloud Console and add redirect URI for extension

set -e

FUNCTION_APP_NAME="${FUNCTION_APP_NAME:-ghostlog-api}"
RESOURCE_GROUP="${RESOURCE_GROUP:-ghostlog-rg}"
LOCATION="${LOCATION:-eastus}"
STORAGE_ACCOUNT="${STORAGE_ACCOUNT:-ghostlogstorage}"

echo "Deploying GhostLog backend to Azure..."
echo "  Function App: $FUNCTION_APP_NAME"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"

# Build backend
cd "$(dirname "$0")/backend"
npm ci
npm run build

# Deploy (requires func azure functionapp publish)
if command -v func &>/dev/null; then
  echo "Publishing to Azure Function App..."
  func azure functionapp publish "$FUNCTION_APP_NAME" --typescript
else
  echo "Azure Functions Core Tools (func) not found."
  echo "Install: npm i -g azure-functions-core-tools@4"
  echo "Then run: cd backend && func azure functionapp publish $FUNCTION_APP_NAME --typescript"
  echo ""
  echo "Or create resources manually:"
  echo "  az group create --name $RESOURCE_GROUP --location $LOCATION"
  echo "  az storage account create --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS"
  echo "  az functionapp create --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --storage-account $STORAGE_ACCOUNT --consumption-plan-location $LOCATION --runtime node --runtime-version 20 --functions-version 4"
  echo "  az functionapp config appsettings set --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --settings AZURE_TABLE_STORAGE_CONNECTION_STRING=\"<connstr>\" GOOGLE_CLIENT_ID=\"<client-id>\""
  exit 1
fi

echo "Done. Set AZURE_TABLE_STORAGE_CONNECTION_STRING and GOOGLE_CLIENT_ID in Function App settings if not already set."
