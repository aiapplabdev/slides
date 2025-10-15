# Mag Tech Slides – Azure OpenAI Assistant

This project renders Mag Tech’s engineering transformation slides with an AI assistant that surfaces benchmarks and SPACE/DORA insights. The assistant now proxies requests through an Azure Static Web Apps function to keep Azure OpenAI credentials server-side.

## Prerequisites

- Node.js 18+
- Azure subscription with Azure OpenAI deployments (chat + embeddings)
- Azure CLI logged in if you plan to use managed identity

## Project Structure

- `src/` – Vite + React slide deck and chat UI
- `src/services/knowledgeBase.ts` – builds RAG context from `engineering_metrics_benchmark_template.json`
- `api/` – Azure Functions backend exposed through Static Web Apps
- `api/azure-openai/index.js` – HTTP trigger calling Azure OpenAI using the official `@azure/openai` SDK

## Environment Configuration

Populate `api/local.settings.json` for local development (values are examples):

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com",
    "AZURE_OPENAI_API_VERSION": "2023-05-15",
    "AZURE_OPENAI_CHAT_DEPLOYMENT": "gpt-4o-mini",
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT": "text-embedding-3-large",
    "AZURE_OPENAI_KEY": "<optional-key-if-not-using-identity>"
  }
}
```

For production, define equivalent app settings in Azure Static Web Apps (or the linked Function App).

## Install Dependencies

```bash
npm install         # root project
cd api && npm install
```

## Local Development

1. Start Vite:

   ```bash
   npm run dev
   ```

2. In another terminal, run the Static Web Apps CLI proxying the function:

   ```bash
   npm run dev:swa
   ```

   The CLI serves the combined app (default `http://localhost:4280`). The SPA calls `/api/azure-openai`, which the CLI forwards to the Azure Function.

## Deployment

- **Azure Static Web Apps**: Run `az staticwebapp up` or configure the provided workflow to build the Vite app and deploy the `api/` functions.
- Ensure production secrets (`AZURE_OPENAI_*`) are configured in the Static Web Apps portal. For managed identity, grant the SWA Function App access to the Azure OpenAI resource.

## Troubleshooting

- 500 errors from `/api/azure-openai` usually indicate missing env vars or Denied access to Azure OpenAI. Check Function logs via `swa start` output or Azure portal.
- Hot reload errors mentioning “Extension context invalidated” come from browser extensions and can be ignored or mitigated by disabling the extension during dev.

## Testing the Chat

With both dev servers running, open the app and ask questions such as “What are the biggest SPACE gaps?”. The assistant streams responses grounded in the slide JSON and cites relevant sections.
