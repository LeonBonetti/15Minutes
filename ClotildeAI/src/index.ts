import say from 'say';
import wikipedia from "wikipedia";
import jokes from './jokes.json';
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const wikisearch = async (topic: string) => {
    const search = await wikipedia.search(topic);
    const page = await wikipedia.page(search.results[0].title);
  
    const summary = await page.summary();
  
    return summary.extract;
}

const speak = (text: string) => {
    return new Promise((resolve, reject) => {
        say.speak(text, 'Samantha', 0.9, (err) => {
            if(err) reject(err);
            resolve(true);
        });
    })
}

let name = "";

rl.question("What is your name ? ", async function(received: string) {
        name = received;
        await speak(`Hello ${received}, my name is Clotilde`);
        ask();
});


const ask = () => {
    rl.question("ask me something: ", async function(rQuery: string) {
    
        if(rQuery == 'stop') {
            say.stop();
            return rl.close();
        }

        if(rQuery.toLocaleLowerCase().split(' ').findIndex(item => item == 'joke') > -1) {
            const jokeIndex = Math.floor(Math.random() * jokes.length);
            const joke = jokes[jokeIndex];
            await speak(joke.text);
        } else {
            const searchTopic = await wikisearch(rQuery);
            await speak(`According to wikipedia, ${searchTopic}`);
        }

        ask();
    });
}
    

rl.on("close", async function() {
    console.log("\nBYE BYE !!!");
    await speak("Bye Bye");
    process.exit(0);
});