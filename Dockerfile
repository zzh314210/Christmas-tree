
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com
RUN npm install
ARG API_KEY
ENV API_KEY=$API_KEY

COPY . .
RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "start"]