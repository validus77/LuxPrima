# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
# Increase npm resilience for slower/congested networks
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retries 5 && \
    npm install
COPY . .
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
