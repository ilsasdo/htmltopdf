FROM ghcr.io/puppeteer/puppeteer:23.11.1
ADD package.json package.json
RUN npm install -y
EXPOSE 3000
ADD index.js index.js
CMD ["node", "index.js"]
