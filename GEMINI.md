# Conversational Language Learning App

This application allows users to learn a language through real-time voice conversation with an AI tutor.

## Architecture

### 1. UI (`/ui`)
- **Tech Stack:** React, Vite, TypeScript, Tailwind CSS.
- **Functionality:** Handles audio recording, playback, and visual feedback for the conversation.
- **Communication:** Connects to the backend via WebSockets (`/ws/live`).

### 2. Backend (`/backend`)
- **Tech Stack:** Node.js, TypeScript, Express, `ws` library.
- **Functionality:** Orchestrates the connection between the user and the Gemini Live API.
- **Service:** Uses `GeminiLiveService` to interact with Google's GenAI Live API.

### 3. Infrastructure (`/infra`)
- **Framework:** AWS CDK (TypeScript).
- **Architecture:** Managed Service Strategy (App Runner + DynamoDB).
- **Hosting:** AWS App Runner.
- **Why:** Chosen for POC/Beta to eliminate the high fixed costs of ALB (~$20/mo) and NAT Gateways (~$32/mo). App Runner natively supports WebSockets and handles SSL.

## Key Findings & Quirks

### 1. Unified Deployment
We use a single Docker container to serve both the React UI and the Node.js backend. This simplifies deployment and avoids CORS issues. The `backend/Dockerfile` uses a multi-stage build to bundle both.

### 2. Dependency Management
- **Vite in Production:** To prevent production crashes, `vite` (a devDependency) must be dynamically imported in the backend code. 
- **Docker Context:** The Docker build context must be set to the project root to allow the backend build to access the `ui` workspace and root `package.json`.

### 3. Environment Quirks
- **WSL Docker Auth:** When deploying from WSL/Linux, the `secretservice` credential helper may fail. See `infra/README.md` for the mock helper workaround.
- **Node Version:** The project is standardized on **Node 22+**.

## Data & Persistence

### Database Structure: DynamoDB
We will use **Amazon DynamoDB** for its serverless scalability, low latency, and tight integration with AWS.

#### Rationale:
- **Scalability:** Handles any number of concurrent users without managing connection pools (critical for WebSocket architectures).
- **Cost:** Pay-per-request model is ideal for early-stage apps.
- **Local Dev:** Easily emulated using `dynamodb-local`.

#### Data Modeling (Single-Table Design):
We'll use a single table (e.g., `ConverseApp`) to store all entities, using Partition Keys (PK) and Sort Keys (SK) for efficient access:

| Entity | PK | SK | Attributes |
| :--- | :--- | :--- | :--- |
| **User** | `USER#<id>` | `METADATA` | `username`, `email`, `total_xp`, `streak_count`, `last_active` |
| **Progress** | `USER#<id>` | `LANG#<lang_id>` | `level`, `fluency_score` |
| **Mission Result** | `USER#<id>` | `MISSION#<timestamp>` | `mission_id`, `score`, `accuracy`, `feedback` |
| **Vocabulary** | `USER#<id>` | `WORD#<word>` | `mastery_level`, `last_reviewed` |

### Gamification Logic
- **XP & Streaks:** Incremented via atomic updates in DynamoDB during mission completion.
- **Leaderboards:** Can be implemented using a **Global Secondary Index (GSI)** on `total_xp` or via a separate scheduled aggregation.

## Authentication & Security

### Gemini Live API Connection
- **Mechanism:** The backend connects to Google's GenAI Live API via a secure WebSocket using the `@google/genai` SDK.
- **Authentication:**
    - **Backend-to-Google:** Authenticated using the `GEMINI_API_KEY` stored in server-side environment variables.
    - **Client-to-Backend:** Users connect to our backend via a WebSocket (`/ws/live`). 
    - **Security:** We will implement **JWT (JSON Web Token)** authentication. The user must provide a valid token (obtained via an AWS Cognito or a custom auth flow) in the WebSocket handshake (via query params or headers) before the backend initiates a session with Gemini.

## Cost Estimates (Rough)

Based on **Gemini 2.0 Flash** Live API pricing (as of May 2026):

### 1. Model Usage (Live API)
- **Audio Input:** ~$2.10 per 1M tokens (~32 tokens/sec = **$0.24 per hour** of continuous listening).
- **Audio Output:** ~$8.50 per 1M tokens (~32 tokens/sec = **$0.98 per hour** of continuous speaking).
- **Total:** For an average learning session with balanced turn-taking, estimate **~$0.60 - $0.80 per active user-hour**.

### 2. AWS Infrastructure
- **ECS Fargate:** ~$15 - $30/month for a small, always-on instance (minimum 1 task).
- **ALB:** ~$20/month base cost.
- **RDS (PostgreSQL):** ~$15 - $25/month for a `db.t4g.micro`.
- **Total Fixed Cost:** **~$50 - $75/month** for a basic production setup.

## Development Workflow

- **Restructuring:** The project is being moved from a monolithic `src/` structure to a clean top-level division: `ui/`, `backend/`, and `infra/`.
- **Environment:** Requires a `GEMINI_API_KEY` in a `.env` file.

## Build and Deploy

### Local Development
- Root orchestrator (if any) or individual package commands.
- `backend`: `npm run dev` (running on port 3000).
- `ui`: `npm run dev` (proxied or pointing to backend).

### AWS Deployment
- Managed via AWS CDK or Terraform (to be implemented in `/infra`).
