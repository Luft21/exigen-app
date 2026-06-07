FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Mock DATABASE_URL during build time to satisfy Prisma config validation
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

ENV PORT=3000

# Runs database schema sync and seed on startup before launching Next.js app
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npm run start"]
