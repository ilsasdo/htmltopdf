import puppeteer from "puppeteer";
import express from "express";
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import {v4 as uuidv4} from 'uuid';
import winston from 'winston';

const ALLOWED_FORMATS = ['pdf', 'jpg', 'png'];
const MAX_TIMEOUT = 30000; // 30 seconds - default puppeteer timeout


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

async function initBrowser() {
  logger.info("Launching browser...");
  try {
    return await puppeteer.launch({
      headless: true,
      args: [
        '--disable-dev-shm-usage' // use /tmp instead of /dev/shm, chrome may crash in memory limited environments
      ]
    });
  } catch (error) {
    logger.error("Failed to launch browser:", { error: error.message, stack: error.stack });
    throw error;
  }
}

logger.info("launching express server...");
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * body:
 *
 * {
 *   headers: List<Record<String, String>>, see: https://pptr.dev/api/puppeteer.page.setextrahttpheaders
 *   cookies: List<CookieParam>, see: https://pptr.dev/api/puppeteer.cookieparam
 *   options: PDFOptions | ScreenshotOptions, see: https://pptr.dev/api/puppeteer.pdfoptions | https://pptr.dev/api/puppeteer.screenshotoptions
 * }
 */
app.post("/convert", async (req, res) => {

  const url = req.query.url;
  const output = req.query.output;
  const body = req.body;

  if (!url) {
    return res.status(400).json({error: "Invalid url", message: "url must be specified"});
  }

  if (!ALLOWED_FORMATS.includes(output)) {
    return res.status(400).send({error:"Invalid output format.", message: "output must be pdf or jpg or png"});
  }

  const browserContext = await browser.createBrowserContext();

  const page = await browserContext.newPage();

  await page.setExtraHTTPHeaders(body.headers || {});
  if (body.cookies) {
    await page.setCookie(...body.cookies);
  }

  let tempFile = null;
  try {
    tempFile = path.join(os.tmpdir(), `${uuidv4()}.${output}`);
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['media', 'websocket'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle0', // wait until there are no network connections for at least 500 ms, not sure if this is very big
      timeout: MAX_TIMEOUT
    });

    await page.setViewport({width: 1080, height: 1024})
    if (output === "pdf") {
      logger.info("Producing pdf for: ", {url: url});
      await page.pdf({...body.options, path: tempFile});
    } else {
      logger.info("Producing screenshot for: ", {url: url});
      await page.screenshot({...body.options, path: tempFile});
    }

    res.sendFile(tempFile, async (error) => {
      if (error) {
        logger.error('Error sending file:', {error: error.message, stack: error.stack});
      }
      await cleanup(browserContext, page, tempFile);
    });
  } catch (e) {
    logger.error('Error sending file:', {error: e.message, stack: e.stack});
    await cleanup(browserContext, page, tempFile);  // Added cleanup here
    res.status(500).json({message: e.message});  // Changed to e.message for better error output
  }
});

async function cleanup(context, page, file) {
  try {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (file) await fs.unlink(file).catch(() => {});
  } catch (error) {
    logger.error('Cleanup error:', {error: error.message, stack: error.stack});
  }
}

let browser;
async function startServer() {
  try {
    browser = await initBrowser();
    const port = process.env.PORT || 3100;
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', {error: error.message, stack: error.stack});
    process.exit(1);
  }
}

startServer();