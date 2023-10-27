FROM node:18

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install --only=prod

COPY . .

ARG APP_VERSION=app-unknown-version
ENV APP_VERSION=${APP_VERSION}

EXPOSE 3000

CMD [ "yarn", "start" ]
