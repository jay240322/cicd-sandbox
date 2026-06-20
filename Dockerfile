# === STAGE 1: Build the React Frontend ===
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# This creates a static production build folder (usually named 'dist' or 'build')
RUN npm run build

# === STAGE 2: Setup the Node.js Backend & Combine ===
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/

# Copy the static React build files from Stage 1 into the backend folder
COPY --from=frontend-builder /app/frontend/dist ./backend/src/public

# Expose the single port (Backend port)
EXPOSE 5000

# Start the backend server
CMD ["node", "backend/server.js"]   