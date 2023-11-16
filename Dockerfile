FROM node:17.5.0-stretch as build-stage
# Installing base node.js image

WORKDIR /app
# Create a directory to hold app code inside the image

COPY ./package*.json /app/
COPY ./src /app/src
COPY ./tsconfig*.json /app/

#COPY . .

# Installing dependencies into app folder
RUN npm install
# Installing dependencies for build stage




# builds the app
RUN npm run build


# Entry point into the JS file
ENV PORT=3000

ENTRYPOINT node /app/dist/main.js
# CMD ["sleep", "3000"]

EXPOSE 3000
