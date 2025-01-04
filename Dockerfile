FROM ghcr.io/puppeteer/puppeteer:23.11.1
ADD package.json package.json
ADD index.js index.js
RUN npm install -y
EXPOSE 3000
CMD ["node", "index.js"]
