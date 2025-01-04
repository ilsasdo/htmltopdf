import puppeteer from "puppeteer";

const browser = await puppeteer.launch({headless:true, args: ["--no-sandbox"]});
const page = await browser.newPage();
await page.goto("http://www.google.com");
await page.setViewport({width: 1080, height: 1024})
await page.screenshot({
  path: "screen.png"
});
await page.pdf({path: "screen.pdf"});
await browser.close()

