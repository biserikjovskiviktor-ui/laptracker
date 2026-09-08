FROM node:22-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Vite builds into 'dist' by default
RUN npm run build

# Serve the 'dist' folder
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist"]