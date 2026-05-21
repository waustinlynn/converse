FROM node:20-slim

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY ui/package.json ./ui/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application in dev mode
CMD ["npm", "run", "dev:backend"]
