# Use a lightweight Node.js Linux image
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build the Nuxt app for production
RUN npm run build

# Expose the port Nuxt runs on
EXPOSE 3000

# Nuxt 3 requires HOST to be 0.0.0.0 to be accessible outside the container
ENV NITRO_HOST=0.0.0.0
ENV PORT=3000

# Start the production server
CMD ["node", ".output/server/index.mjs"]