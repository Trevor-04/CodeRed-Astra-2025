# Backend Dockerfile (Node.js + Express)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Use npm ci when package-lock.json exists to get reproducible installs.
RUN if [ -f package-lock.json ]; then npm ci --include=dev; else npm install --include=dev; fi
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]
