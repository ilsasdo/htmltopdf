FROM node:23.5-bullseye
RUN apt-get update -y && apt-get install -y libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libxkbcommon-x11-0 libasound2 
ADD package.json package.json
ADD index.js index.js
