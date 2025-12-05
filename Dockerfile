FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

# Install wget for healthcheck
RUN apk --no-cache add wget

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
