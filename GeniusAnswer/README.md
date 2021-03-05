# 15 minutes to create: Telegram Bot that can answer any question


## Introduction
In last article we create a [personal assistant in 15 minutes](https://dev.to/leonardbonetti/15-minutes-to-create-a-personal-assistant-that-can-search-on-wikipedia-and-tell-some-horrible-jokes-1bc7), 
due to its good acceptance, I decided to bring other challenges of 15 minutes, today, a telegram bot called Genius, he will try to answer anything you ask

## The rules:
    - interact with the system by telegram chat (Obviously)
    - Searches must be carried out using wikipedia
    - The robot must be able to change its response if it is not satisfactory to the user

## Let's start
### Create project
Create a folder to your project, on terminal execute the following command:
`npm init -y && npx ts-init`

Check that your `tsconfig.json` file is as follows
```
{
  "compilerOptions": {
    "lib": [
      "es6",
      "DOM"
    ],
    "alwaysStrict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "files": [
    "src/index.ts"
  ]
}
```

### Lets get our packages
- `npm i node-telegram-bot-api --save && npm i @types/node-telegram-bot-api -D` [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) is an amazing library to abstract Telegram Bot API and make our lives easier.
- `npm i wikipedia --save` [Wikipedia](https://www.npmjs.com/package/wikipedia) is a simple lib that abstract the wiki endpoints.

### Create our bot
  - Open your telegram and search for @BotFather
  ![searchBotFather](https://github.com/LeonBonetti/15Minutes/raw/master/GeniusAnswer/assets/searchBotFather.png)
  - Open the conversation and click in start
  ![startBotFather](https://github.com/LeonBonetti/15Minutes/raw/master/GeniusAnswer/assets/startBotFather.png)
  - Type `/newBot`
  ![typeNewBot](https://github.com/LeonBonetti/15Minutes/raw/master/GeniusAnswer/assets/typingNewBot.png)
  - Give the common name and the name of the robot as indicated by the telegram instructions
  ![giveBotName](https://github.com/LeonBonetti/15Minutes/raw/master/GeniusAnswer/assets/giveBotName.png)
  - Save the token key in some place to we use later

### Let's code
First of all, wee need to import the libraries thar will be used, so, create a file named `src/index.ts`.
```
import telegram from 'node-telegram-bot-api';
import wikipedia from 'wikipedia';

const TELEGRAM_KEY = "YOUR-API-KEY-HERE";
```
*remember to replace where YOUR-API-KEY-HERE is written with your robot key*

#### Create some interaction
Paste this code inside your `src/index.ts`
```
...
const Bot = new telegram(TELEGRAM_KEY, {polling: true});

Bot.onText(/\/start/, async (msg) => {
    if(!msg.from) return Bot.sendMessage(msg.chat.id, 'I not accept you!');
    Bot.sendMessage(msg.chat.id, 'Wellcome to GeniusAnswer, ask me something');
});
```
When a user starts the bot, we send a message asking the user to ask something

#### The main function
Paste this code inside your `src/index.ts`

```
...
const wikisearch = async (topic: string, pageIndex: number) => {
    const search = await wikipedia.search(topic);
    
    if(pageIndex > search.results.length) throw new Error('Invalid page index');

    const page = await wikipedia.page(search.results[pageIndex].title);

    const summary = await page.summary();

    return {text: summary.extract, pageIndex: 0, pageLength: search.results.length};
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

});
```
Here we only create a search function thata can make searchs on wikipedia and return the index of this result, if wee need a diferent result for this question, we only need to pass a diferent index for the function.
On next function wee listen for text messages send to our bot, on result wee put a button that can change the index of search.

#### The callback function
Paste this code inside your `src/index.ts`
```
...
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
```
Ok, although the callback function is very long to be understood, we just capture the search topic and change the index, depending on whether or not you have a next or previous page, we add the respective buttons to the message.

### Now your code need to be like this
```
import telegram from "node-telegram-bot-api";
import wikipedia from "wikipedia";

const TELEGRAM_KEY = "YOUR-TELEGRAM-KEY-HERE";

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
```

Now, our code is complete, let's test?

Run `npm run ts` on your terminal and open your telegram.
Search for your bot name (the same that you create in the begin of this article, generally ends with _bot) and press START.

Enjoy yourself!

**There are some ways to optimize the response time of this robot, if you are interested I can show them in another article later, but I believe this is an interesting challenge for those who liked the idea of ​​the robot, leave in the comments your solutions and ideas**