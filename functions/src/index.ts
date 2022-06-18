import * as functions from "firebase-functions";
import { Configuration, OpenAIApi } from "openai";
const puppeteer = require("puppeteer");
const Alpaca = require("@alpaca/alpaca-trade-api");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const alpaca = new Alpaca({
  paper:true
})


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

export const helloWorld = functions.https.onRequest(
  async (request, response) => {

    const data = await scrape();

    const gptCompletetion = await openai.createCompletion({
      model: "text-davinci-002",
      prompt:
        `${data} Nancy Pelosi would recommend buying the following stock tickers:`,
      temperature: 0.7,
      max_tokens: 32,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    response.send(gptCompletetion.data);
  }
);
