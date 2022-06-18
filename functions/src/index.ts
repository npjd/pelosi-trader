import * as functions from "firebase-functions";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: functions.config().openai.key,
});

const openai = new OpenAIApi(configuration);

export const helloWorld = functions.https.onRequest(
  async (request, response) => {
    const gptCompletetion = await openai.createCompletion({
      model: "text-davinci-002",
      prompt: "Nancy Pelosi would recommend buying the following stocks:",
      temperature: 0.7,
      max_tokens: 32,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    response.send(gptCompletetion.data);
  }
);
