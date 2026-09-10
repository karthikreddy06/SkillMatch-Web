# Stage 1: Build static distribution
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Build arguments for production configuration
ARG VITE_APP_URL=https://skillmatch-frontend-spk8.onrender.com
ARG VITE_API_BASE_URL=https://skillmatch-backend-uo7v.onrender.com/api
ARG VITE_API_URL=https://skillmatch-backend-uo7v.onrender.com/api
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL

# Build Vite dist output
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
