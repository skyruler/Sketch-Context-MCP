FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the default port
EXPOSE 3333

# Command to run the server
CMD ["node", "index.js"] 