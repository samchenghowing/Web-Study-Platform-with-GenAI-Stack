# Stage 1: Build the React application
FROM node:20 AS build

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (or yarn.lock) files
COPY package*.json /usr/src/app

# Install dependencies
RUN npm ci

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . /usr/src/app

# Build the application
RUN npm run build

# Stage 2: Serve the React application from Nginx
FROM nginx:alpine

# Copy the built assets from the build stage to the default nginx html directory
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# for react-router inside docker and nginx 
# https://stackoverflow.com/questions/51378080/containerized-reactjs-application-from-nginx-image-does-not-serve-all-routes
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx

# Expose port 80 to the Docker host, so we can access it from the outside.
EXPOSE 3000

# Start Nginx and keep it running in the foreground
CMD ["nginx", "-g", "daemon off;"]