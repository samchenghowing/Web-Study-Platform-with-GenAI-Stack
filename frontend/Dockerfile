# Stage 1: Build the React application
FROM node:alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock) files
COPY package*.json /app

# https://forums.docker.com/t/npm-install-in-docker-tutorial-is-taking-forever/139328/9
RUN npm config set strict-ssl false

# Install dependencies
RUN npm ci

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . /app

# Expose port 80 to the Docker host, so we can access it from the outside.
EXPOSE 8505

ENTRYPOINT [ "npm", "run", "dev" ]
