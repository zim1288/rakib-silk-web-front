# Production Dockerfile for Rakib Silk & Fashion Backend API
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose server port (Render & container hosts will map this)
EXPOSE 5000

# Health check instruction for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the server
CMD ["npm", "start"]
