FROM node:18-alpine

# Install Docker CLI and Compose plugin
RUN apk add --no-cache docker-cli docker-cli-compose

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
