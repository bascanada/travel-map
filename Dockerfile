FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache jpegoptim exiftool

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
