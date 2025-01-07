import puppeteer from "puppeteer";
import express from "express";
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import {v4 as uuidv4} from 'uuid';

console.log("launching browser")
const browser = await puppeteer.launch({headless: true});

console.log("launching express");
const app = express();
const port = 3000;

/**
 * body:
 *
 * {
 *   headers: List<Record<String, String>>, see: https://pptr.dev/api/puppeteer.page.setextrahttpheaders
 *   cookies: List<CookieParam>, see: https://pptr.dev/api/puppeteer.cookieparam
 *   options: PDFOptions | ScreenshotOptions, see: https://pptr.dev/api/puppeteer.pdfoptions | https://pptr.dev/api/puppeteer.screenshotoptions
 * }
 */
app.use(express.json());

app.post("/convert", async (req, res) => {

  const url = req.query.url;
  const output = req.query.output;
  const body = req.body;

  if (!url) {
    res.status(400).send({message: "url must be specified"});
    return;
  }
  if (!output) {
    res.status(400).send({message: "output must be pdf or jpg or png"});
    return;
  }

  const browserContext = await browser.createBrowserContext();
  await browserContext.setCookie(body.cookies);

  const page = await browserContext.newPage();
  await page.setExtraHTTPHeaders(body.headers);

  let tempFile = path.join(os.tmpdir(), `${uuidv4()}.${output}`);
  try {
    await page.goto(url);
    await page.setViewport({width: 1080, height: 1024})
    if (output === "pdf") {
      console.log("Producing pdf for: " + url);
      await page.pdf({...body.options, path: tempFile});
      res.sendFile(tempFile);
    } else {
      console.log("Producing screenshot for: " + url);
      await page.screenshot({...body.options, path: tempFile});
      res.sendFile(tempFile);
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({message: e});
  } finally {
    await browserContext.close();
    await page.close();
    fs.rm(tempFile, () => {});
  }
});

app.listen(port, () => {
  console.log("listening on port", port);
})
