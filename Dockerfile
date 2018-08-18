FROM node:8.9-alpine AS build

RUN apk update

RUN mkdir /app
WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm install --no-optional

# Everything above should be cached by docker. The below should run on every build

COPY . /app/

FROM node:8.9-alpine
MAINTAINER Quintype Developers <dev-core@quintype.com>

RUN apk update && \
    apk add tini && \
    addgroup -S app && \
    adduser -S -g app app

ENV NODE_ENV production
WORKDIR /app
USER app

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

COPY --from=build --chown=app:app /app /app
