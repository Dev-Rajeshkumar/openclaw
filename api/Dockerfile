# Strapi v5 CMS API — Multi-stage Docker build
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev

FROM base AS dependencies
COPY package.json ./
RUN npm install --production=false

FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/config ./config
COPY --from=build /app/src ./src
EXPOSE 1337
CMD ["npm", "start"]

FROM dependencies AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 1337
CMD ["npm", "run", "dev"]
