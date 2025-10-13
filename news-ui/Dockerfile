# Use a specific stage for development
FROM node:22-alpine AS dev

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the Vite default port
EXPOSE 5173

# Command to run the Vite development server
# --host is needed to expose the server to other docker containers
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
