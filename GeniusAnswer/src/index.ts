import telegram from "node-telegram-bot-api";
import wikipedia from "wikipedia";

const TELEGRAM_KEY = "YOUR-API-KEY-HERE";

const Bot = new telegram(TELEGRAM_KEY, { polling: true });

Bot.onText(/\/start/, (msg) => {
  if (!msg.from) return Bot.sendMessage(msg.chat.id, "I not accept you!");
  Bot.sendMessage(msg.chat.id, "Wellcome to GeniusAnswer, ask me something");
});

const wikisearch = async (topic: string, pageIndex: number) => {
  const search = await wikipedia.search(topic);

  if (pageIndex > search.results.length) throw new Error("Invalid page index");

  const page = await wikipedia.page(search.results[pageIndex].title);

  const summary = await page.summary();

  return {
    text: summary.extract,
    pageIndex: pageIndex,
    pageLength: search.results.length,
  };
};

Bot.on("text", async (msg) => {
  if (!msg.from) return Bot.sendMessage(msg.chat.id, "I not accept you!");
  if (!msg.text) return Bot.sendMessage(msg.chat.id, "Invalid message");
  if (msg.text[0] === "/") return;

  Bot.sendMessage(msg.chat.id, `Searching for ${msg.text} ...`);

  const search = await wikisearch(msg.text, 0);

  console.log(search);

  let options_button = {};
  if (search.pageIndex < search.pageLength) {
    options_button = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Next Answer ->",
              callback_data: JSON.stringify({ topic: msg.text, pageIndex: 1 }),
            },
          ],
        ],
      },
    };
  }

  return Bot.sendMessage(
    msg.chat.id,
    `${search.text} \n Answer ${search.pageIndex + 1}/${search.pageLength}`,
    options_button
  );
});

Bot.on("callback_query", async (callback) => {
  if (!callback.data || !callback.message) return;

  console.log(callback.data);

  const data = JSON.parse(callback.data) as {
    topic: string;
    pageIndex: number;
  };

  try {
    const search = await wikisearch(data.topic, data.pageIndex);

    console.log(search);

    let options_button = {};
    let inline_keyboard_buttons = [];
    if (search.pageIndex + 1 < search.pageLength) {
      inline_keyboard_buttons.unshift({
        text: "Next Answer ->",
        callback_data: JSON.stringify({
          topic: data.topic,
          pageIndex: search.pageIndex + 1,
        }),
      });

      if (search.pageIndex > 0) {
        inline_keyboard_buttons.unshift({
          text: "<- Previous Answer",
          callback_data: JSON.stringify({
            topic: data.topic,
            pageIndex: search.pageIndex - 1,
          }),
        });
      }
    } else if (search.pageIndex + 1 === search.pageLength) {
      inline_keyboard_buttons.unshift({
        text: "<- Previous Answer",
        callback_data: JSON.stringify({
          topic: data.topic,
          pageIndex: search.pageIndex - 1,
        }),
      });
    }

    if (inline_keyboard_buttons.length > 0) {
      options_button = {
        reply_markup: {
          inline_keyboard: [inline_keyboard_buttons],
        },
      };
    }

    return Bot.editMessageText(
      `${search.text} \n Answer ${search.pageIndex + 1}/${search.pageLength}`,
      {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        ...options_button,
      }
    );
  } catch (error) {
    return Bot.editMessageText(
      "Sorry, an error seems to have happened, please try again later",
      {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
      }
    );
  }
});
