import puppeteer from "puppeteer";
import express from "express";
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import {v4 as uuidv4} from 'uuid';

console.log("launching browser")
const browser = await puppeteer.launch(
    {headless: true, args: ["--no-sandbox"]});

console.log("launching express");
const app = express();
const port = 3000;
app.get("/convert", async (req, res) => {

  const url = req.query.url;
  const type = req.query.type;

  if (!url) {
    res.status(400).send({message: "url must be specified"});
    return;
  }
  if (!type) {
    res.status(400).send({message: "type must be pdf or jpg or png"});
    return;
  }

  const page = await browser.newPage();
  let tempFile = path.join(os.tmpdir(), `${uuidv4()}.${type}`);
  try {
    await page.goto(url);
    await page.setViewport({width: 1080, height: 1024})
    if (type === "pdf") {
      console.log("Producing pdf for: " + url);
      await page.pdf({path: tempFile});
      res.sendFile(tempFile);
    } else {
      console.log("Producing screenshot for: " + url);
      await page.screenshot({
        path: tempFile
      });
      res.sendFile(tempFile);
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({message: e});
  } finally {
    await page.close()
    fs.rm(tempFile, () => {})
  }
});

app.listen(port, () => {
  console.log("listening on port", port);
})
