# Frontend Dockerfile for Next.js Recipe Manager

FROM node:24-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Set environment variable for API URL
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server with hot-reload
CMD ["npm", "run", "dev"]
