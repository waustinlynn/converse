# Infrastructure (Low-Cost POC)

This project uses **AWS App Runner** and **DynamoDB** to provide a high-performance, low-cost ($5-$10/mo) environment for the conversational tutor.

## 1. Architecture

- **Compute:** [AWS App Runner](https://aws.amazon.com/apprunner/) - Managed container service. Handles SSL, auto-scaling, and WebSockets.
- **Database:** [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) - Serverless NoSQL database.
- **Registry:** [Amazon ECR](https://aws.amazon.com/ecr/) - Stores the Docker images built from `/backend`.

## 2. Deployment Workflow

### Prerequisites
- AWS CLI installed and configured.
- Node.js 20+ and `npm` installed.
- Docker running (required for CDK to build the image).

### Commands
1. **Bootstrap (One-time):**
   ```bash
   npx cdk bootstrap
   ```
2. **Deploy:**
   ```bash
   npx cdk deploy --all
   ```
   *Note: This will output a `ServiceUrl`. This is your live application URL.*

3. **Post-Deployment Configuration:**
   Go to the AWS App Runner console, find your service, and add the following environment variable:
   - `GEMINI_API_KEY`: Your Google GenAI API Key.

## 3. Authentication Configuration

While the basic infrastructure is deployed via CDK, the following manual steps are required for a full Beta launch:

### A. AWS Cognito (Identity)
The current POC uses a simple JWT-based flow. For a robust identity provider:
1. Create a **Cognito User Pool**.
2. Create an **App Client** (disable "Generate client secret" for SPA use).
3. Add the `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` to your UI `.env` file.

### B. Google Auth (Optional)
To allow "Login with Google":
1. Create credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add the "Authorized redirect URIs" to match your App Runner `ServiceUrl` (e.g., `https://xxxx.awsapprunner.com/auth/callback`).
3. Configure the Google Identity Provider within your Cognito User Pool.

## 4. Teardown

To avoid any ongoing costs, you can destroy the infrastructure:

```bash
npx cdk destroy --all
```

**Note on Persistence:** The DynamoDB table is configured with `RemovalPolicy.RETAIN`. After running `cdk destroy`, the table will still exist in your AWS account to prevent data loss. If you wish to delete the data as well, you must delete the table manually in the DynamoDB console.

## 6. Common Pitfalls & Troubleshooting

### Docker Authentication (WSL/Linux)
If `cdk deploy` fails with a `docker login` error related to `secretservice` or `dbus`:
1. **The Issue:** Docker is trying to use a GUI-based credential helper in a CLI environment.
2. **The Fix:** Shadow the credential helper with a mock script that uses a local file:
   ```bash
   # Create a mock helper
   echo '#!/bin/bash
   STORE_FILE="$(pwd)/.docker_creds.json"
   [ "$1" == "store" ] && cat > "$STORE_FILE" && exit 0
   [ "$1" == "get" ] && read t && [[ "$t" == *"dkr.ecr"* ]] && cat "$STORE_FILE" && exit 0 || echo "{}"
   exit 0' > docker-credential-secretservice
   chmod +x docker-credential-secretservice
   export PATH=$(pwd):$PATH
   ```

### Container Startup Crashes
If App Runner fails to stabilize (Health Check failure):
- **API Key:** Ensure `GEMINI_API_KEY` is not empty. The app will exit if it's missing.
- **Vite Leak:** Do not import `vite` at the top level of `index.ts`. Use dynamic `await import("vite")` to prevent production environments from crashing on missing dev dependencies.
- **Build Context:** Ensure the Docker context is the project root, not the `backend` folder, so that workspace files are available during build.

### CDK v2 Migration
If `cdk bootstrap` fails with "Unsupported feature flag", check `infra/cdk.json`. Remove any flags that were deprecated in the move from v1 to v2 (e.g., `dockerIgnoreSupport`).
