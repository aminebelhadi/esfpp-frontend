#application build  stage
FROM node:22.20.0-alpine AS builder
WORKDIR /app
COPY package-lock.json .
COPY package.json .
COPY . .
RUN npm install
RUN npm run build

#image build stage
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD [ "nginx", "-g", "daemon off;" ]