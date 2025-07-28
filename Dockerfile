FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache jpegoptim exiftool imagemagick

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
