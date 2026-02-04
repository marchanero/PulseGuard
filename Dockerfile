# Dockerfile para PulseGuard en Fly.io con TursoDB
FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production=false

# Copiar el resto del código
COPY . .

# Construir el frontend
RUN npm run build

# Limpiar devDependencies para reducir tamaño de imagen
RUN npm prune --production

# Exponer el puerto
EXPOSE 3001

# Variable de entorno para producción
ENV NODE_ENV=production

# Comando para iniciar
CMD ["node", "server/index.js"]
