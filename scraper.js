const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const request = require('request-promise');
const fs = require('fs-extra');

async function init() {

    const browser = await puppeteer.launch();

    const page = await browser.newPage();

    await page.goto('https://quotes.toscrape.com/');

    const url = await page.evaluate(() => document.location.href);

    const $ = cheerio.load(await request(url));

    const quotes = $('.quote');

    const writeStream = fs.createWriteStream('quotes.csv');
    writeStream.write('Quote|Author|Tags\n');

    const quoteObjects = [];

    console.log('Scraping: ', url);
    for (let quote of quotes) {
        
        const quoteObject = {
            quoteObjText: "",
            quoteObjAuthor: "",
            quoteObjTags: ""
        };
        
        const quoteText = $(quote).find('.text').text().slice(1,-1);
        const author = $(quote).find('.author').text();
        const tagArray = [];
        $(quote).find('.tag').each( (index,tag) => {
            tagArray.push($(tag).text());
        });
        const tags = tagArray.join(',');
        writeStream.write(`${quoteText}|${author}|${tags}\n`);

        quoteObject.quoteObjText = quoteText;
        quoteObject.quoteObjAuthor = author;
        quoteObject.quoteObjTags = tags;

        quoteObjects.push(quoteObject);
    };

    while(true) {

        try {
            await page.waitForSelector('.next a', {timeout: 5000});
        } catch (e) {
            console.log("The Scraper hasn't found the selector '.next a' after 5 seconds of initialing the page");
            console.log("Ending the scraping");
            break;
        }

        await page.click('.next a');

        const newUrl = await page.evaluate(() => document.location.href);

        const $ = cheerio.load(await request(newUrl));

        const quotes = $('.quote');

        console.log('Scraping: ', newUrl);

        for (let quote of quotes) {
        
            const quoteObject = {
                quoteObjText: "",
                quoteObjAuthor: "",
                quoteObjTags: ""
            };
            
            const quoteText = $(quote).find('.text').text().slice(1,-1);
            const author = $(quote).find('.author').text();
            const tagArray = [];
            $(quote).find('.tag').each( (index,tag) => {
                tagArray.push($(tag).text());
            });
            const tags = tagArray.join(',');
            writeStream.write(`${quoteText}|${author}|${tags}\n`);
    
            quoteObject.quoteObjText = quoteText;
            quoteObject.quoteObjAuthor = author;
            quoteObject.quoteObjTags = tags;
    
            quoteObjects.push(quoteObject);
        };

    }

    fs.writeJSON('quotes.json',quoteObjects,{spaces: 2});

    await browser.close();

    console.log("The scraping has ended");
    
}

init();