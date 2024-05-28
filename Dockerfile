# Base image
FROM node:20

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the app's source code
COPY . .

# build prisma types, build, clear cache
RUN npx prisma generate && npm run build && npm cache clean --force

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start-prod"]