# Infrastructure (AWS CDK)

This project uses a **Multi-Stack Strategy** to provide clear boundaries, protect persistent data, and allow for rapid application iteration.

## 1. Architectural Boundaries (Stacks)

Instead of a single monolithic deployment, we split the infrastructure into specialized "Stacks."

### A. `NetworkStack` (The Foundation)
- **Resources:** VPC, Public/Private Subnets, Internet Gateway.
- **Lifecycle:** Deployed once. Changes very rarely.
- **Boundary:** Isolates the networking logic from the application.

### B. `DataAuthStack` (The State)
- **Resources:** DynamoDB Table, Cognito User Pool, Cognito Client.
- **Lifecycle:** Contains all persistent user data.
- **Safety:** `removalPolicy: RemovalPolicy.RETAIN` is enabled here to prevent accidental data loss during a `cdk destroy`.
- **Boundary:** This stack is the "Source of Truth" for identity and persistence.

### C. `AppStack` (The Compute)
- **Resources:** ECS Cluster, Fargate Service (Backend), ALB (Load Balancer).
- **Lifecycle:** Iterated on frequently. This is where your Node.js container lives.
- **Boundary:** Connects to the `NetworkStack` for routing and `DataAuthStack` for permissions.

## 2. State Management

Unlike Terraform, CDK does not use a local state file.
- **CloudFormation:** State is stored natively in AWS as a CloudFormation Stack.
- **Dependency Injection:** We pass objects from one stack to another in code (e.g., `const data = new DataStack(app, 'Data'); new AppStack(app, 'App', { table: data.table });`). CDK automatically handles the cross-stack exports for you.

## 3. Deployment Workflow

1.  **Bootstrapping:** `npx cdk bootstrap` (One-time setup for your AWS account).
2.  **Synthesis:** `npx cdk synth` (Translates TS to CloudFormation templates).
3.  **Selective Deploy:**
    - `npx cdk deploy NetworkStack`
    - `npx cdk deploy DataAuthStack`
    - `npx cdk deploy AppStack` (Your most common command).

## 4. Why this approach?
- **Blast Radius:** If you make a mistake in the `AppStack`, your VPC and Database remain untouched.
- **Permissions:** We use **Least Privilege IAM Roles** defined per stack. The `AppStack` only gets the specific ARN of the DynamoDB table from the `DataAuthStack`.
- **Local Dev:** Use `docker-compose` for local dev; use CDK for professional AWS environments.
