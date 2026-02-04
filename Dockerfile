# Dockerfile para PulseGuard en Fly.io con TursoDB
FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Construir el frontend
RUN npm run build

# Exponer el puerto
EXPOSE 3001

# Comando para iniciar
CMD ["npm", "start"]
