# Dockerfile para PulseGuard en Fly.io
FROM node:20-alpine

# Instalar dependencias necesarias para Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer el puerto
EXPOSE 3001

# Comando para iniciar
CMD ["npm", "start"]