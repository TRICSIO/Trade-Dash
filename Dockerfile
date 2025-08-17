# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application's code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Expose port 3000 to the outside world
EXPOSE 3000

# The command to run when the container starts
# Using "npm start" which is defined in package.json as "next start"
CMD ["npm", "start"]
