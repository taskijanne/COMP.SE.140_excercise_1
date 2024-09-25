# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application source code to the container
COPY . .

# Expose port 8199 to the outside world
EXPOSE 8199

# Command to run the application
CMD ["node", "index.js"]
