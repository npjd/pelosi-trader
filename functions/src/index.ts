import * as functions from "firebase-functions";
import {Configuration, OpenAIApi} from "openai";
const puppeteer = require("puppeteer");
const Alpaca = require("@alpaca/alpaca-trade-api");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const alpaca = new Alpaca({
  paper: true,
  keyId: process.env.ALPACA_API_ID,
  secretKey: process.env.ALPACA_API_KEY,
});

async function scrape() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.capitoltrades.com/politicians/P000197", {
    waitUntil: "networkidle2",
  });
  await page.waitForTimeout(3000);

  await page.evaluate(() => {
    return document.body.innerText;
  });
  await browser.close();
}

exports.trader = functions
    .runWith({memory: "4GB"})
    .pubsub.schedule("0 10 * * 1-5")
    .timeZone("America/New_York")
    .onRun(async (ctx) => {
      const data = await scrape();

      const gptCompletetion = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: `${data} Nancy Pelosi would recommend buying the following stock tickers:`,
        temperature: 0.7,
        max_tokens: 32,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      const stocksToBuy =
      // @ts-ignore
      gptCompletetion.data.choices[0].text?.match(/\[A-Z]+\b/g);
      console.log("STOCKS TO BUY:", stocksToBuy);

      if (stocksToBuy === null) {
        console.log("sitting this one out");
        return null;
      }

      const order = await alpaca.createOrder({
      // @ts-ignore
        symbol: stocksToBuy[0],
        notional: 1000,
        side: "buy",
        type: "market",
        time_in_force: "day",
      });

      console.log("ORDER ID:", order.id);

      return null;
    });
