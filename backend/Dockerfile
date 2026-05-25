# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Copy root workspace config and package files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY ui/package.json ./ui/

# Install dependencies for all workspaces
RUN npm install

# Copy source code
COPY backend/ ./backend/
COPY ui/ ./ui/

# Build the UI
RUN npm run build -w ui

# Build the backend
RUN npm run build -w backend

# Stage 2: Runtime
FROM node:22-slim

WORKDIR /app

# Copy the bundled backend, built UI, and static assets
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/ui/dist ./ui/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/src/domain/missions.json ./backend/dist/domain/missions.json

# Install production dependencies for the backend
WORKDIR /app/backend
RUN npm install --omit=dev

# Expose the port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["node", "dist/index.js"]
