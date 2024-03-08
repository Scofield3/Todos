//jest.mock('jquery');
const path = require('path');
const _ = require('lodash');
const LoremIpsum = require("lorem-ipsum").LoremIpsum;

const lorem = new LoremIpsum({
    wordsPerSentence: {
        max: 20,
        min: 7
    }
});

describe('Todos BASIC tests', () => {
    beforeEach(async () => {
        await page.goto('file:///home/mihail/Projects/todos-front/dist/index.html');
    });

    it('should be titled "ToDos"', async () => {
        await expect(page.title()).resolves.toMatch('ToDos');
    });

    it('should show all todos', async () => {
        await page.click('#readAllTodos');

        await page.waitForSelector('table');

        const tableExist = await page.evaluate(() => {
            const table = document.querySelector('table');
            
            return table !== null;
        });

        expect(tableExist).toBeTruthy();
    });
});

describe('Todos CREATE tests', () => {
    const fakeDB = [];

    beforeEach(async () => {
        fakeDB.length = 0;

        await page.goto('file:///home/mihail/Projects/todos-front/dist/index.html');
    });

    it.only('should create a new todo WITHOUT image', async () => {        
        page.on('console', msg => {
            // Print the console message
            console.log('Page Log:', msg.text());
        });


        await page.setRequestInterception(true);

        page.on('request', interceptedRequest => {
            const url = interceptedRequest.url();
            const data = interceptedRequest.postData();
            const jsonData = {};

            if (url.includes("localhost:3000")) {
                console.log('Request URL:', url);
                console.log("data: ", data);
                
                Object.keys(jsonData).forEach(key => delete jsonData[key]);
                jsonData.id = 1;
                const params = new URLSearchParams(data);

                for (const [key, value] of params.entries()) {
                    jsonData[key] = value;
                }
                
                console.log("jsonData: ", jsonData);
            }

            if (url.includes("CreateTodo")) {
                fakeDB.push(jsonData);
                console.log("fakeDB: ", fakeDB);

                interceptedRequest.respond({
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({message: 'OK', error: false, code: 200, result: '1'})
                });
            } else if (url.includes("ReadAllTodos")) {
                //return Promise.resolve({ "message": "OK", "error": false, "code": 200, "result": ["1"] });
                interceptedRequest.respond({
                    headers: { 'Access-Control-Allow-Origin': '*' },
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({message: 'OK', error: false, code: 200, result: ['1']})
                });
            } else {
                interceptedRequest.continue();
            }
        });








        await page.click('#createTodo');

        await page.waitForSelector('#todoModal', { visible: true });

        const loremTitle = lorem.generateSentences(1);
        const loremDescription = lorem.generateSentences(3);
        const loremUsername = lorem.generateWords(1);

        await page.type('#input-title', loremTitle);
        await page.type('#input-description', loremDescription);
        await page.type('#input-username', loremUsername);

        await page.click('#createTodoReq');

        //ONLY FOR TEST WHEN DIV WITH TEXT IS CREATED

        await page.waitForSelector('#createTest');
        //const testElement = await page.$('#createTest');
        //const text = await (await testElement.getProperty('textContent')).jsonValue();

        //expect(text).toBe("THE TODO IS CREATED");
        //END ONLY FOR TEST WHEN DIV WITH TEXT IS CREATED
        




        //console.log("Page content: ", await page.content());
        await page.waitForSelector('table');

        const trElements = await page.$$('table tr');
        const lastTrElement = trElements[trElements.length - 1];
        console.log("lastTrElement: ", lastTrElement);


        const dataAttributes = await page.evaluate(element => {
            return {
                dataTitle: element.getAttribute('data-title'),
                dataDescription: element.getAttribute('data-description'),
                dataUsername: element.getAttribute('data-username')
            };
        }, lastTrElement);


        //FOR INTERCEPTING TEST
        //expect(dataAttributes.dataTitle).toBe("TITLE");
        //expect(dataAttributes.dataDescription).toBe("DESCRIPTION");
        //expect(dataAttributes.dataUsername).toBe(loremUsername);


        //FOR ORIGINAL DB CONNECTION TEST
        //expect(dataAttributes.dataTitle).toBe(loremTitle);
        //expect(dataAttributes.dataDescription).toBe(loremDescription);
        //expect(dataAttributes.dataUsername).toBe(loremUsername);
    });

    it('should create a new todo WITH image', async () => {
        await page.click('#createTodo');

        await page.waitForSelector('#todoModal', { visible: true });

        const loremTitle = lorem.generateSentences(1);
        const loremDescription = lorem.generateSentences(3);
        const loremUsername = lorem.generateWords(1);

        await page.type('#input-title', loremTitle);
        await page.type('#input-description', loremDescription);
        await page.type('#input-username', loremUsername);

        const filePath = 'test-image.jpg';
        const absoluteFilePath = path.resolve(__dirname, filePath)

        const fileInput = await page.$('#input-image');

        await fileInput.uploadFile(absoluteFilePath);
    
        const imgSrc = await page.$eval('#uploadedImg', el => el.src);
        
        await page.click('#createTodoReq');

        await page.waitForSelector('table');

        const trElements = await page.$$('table tr');
        const lastTrElement = trElements[trElements.length - 1];

        const dataAttributes = await page.evaluate(element => {
            return {
              dataTitle: element.getAttribute('data-title'),
              dataDescription: element.getAttribute('data-description'),
              dataUsername: element.getAttribute('data-username'),
              dataImage: element.getAttribute('data-image'),
            };
        }, lastTrElement);

        expect(dataAttributes.dataTitle).toBe(loremTitle);
        expect(dataAttributes.dataDescription).toBe(loremDescription);
        expect(dataAttributes.dataUsername).toBe(loremUsername);
        expect(dataAttributes.dataImage).toBe(imgSrc);
    });
});

describe('Todos UPDATE tests', () => {
    beforeAll(async () => {
        await page.goto('file:///home/mihail/Projects/todos-front/dist/index.html');
    });

    it('should update TITLE of todo', async () => {
        //show console.logs in puppeteer
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        await page.click('#readAllTodos');
        await page.waitForSelector('table');

        const updateButton = await page.$('.updateButton');

        await updateButton.click();
        await page.waitForSelector('#todoModal', { visible: true });

        const selector = '#todoModalContent';
        
        const dataAttributes = await page.evaluate(selector => {
            const element = document.querySelector(selector);
            const dataAttrs = {};

            if (element) {
                for (const attr of element.attributes) {
                    if (attr.name.startsWith('data-')) {
                        dataAttrs[_.camelCase(attr.name)] = attr.value;
                    }
                }
            }
            
            return dataAttrs;
        }, selector);        

        const loremTitle = lorem.generateSentences(1);

        await page.type('#input-title', loremTitle);

        await page.click('#buttonUpdateTodo');
        await page.waitForSelector('table tr');

        const trElements = await page.$$('table tr');
        const lastTrElement = trElements[trElements.length - 1];

        console.log("trElements: ", trElements);
        console.log("lastTrElement: ", lastTrElement);

        const dataAttributesAfterUpdate = await page.evaluate(element => {
            return {
              dataTitle: element.getAttribute('data-title'),
              dataDescription: element.getAttribute('data-description'),
              dataUsername: element.getAttribute('data-username')
            };
          }, lastTrElement);

        expect(dataAttributesAfterUpdate.dataTitle).toBe(loremTitle);
        expect(dataAttributesAfterUpdate.dataDescription).toBe(dataAttributes.dataDescription);
        expect(dataAttributesAfterUpdate.dataUsername).toBe(dataAttributes.dataUsername);
    });

    it('should update Description of todo', async () => {
        await page.click('#readAllTodos');
        await page.waitForSelector('table');

        const updateButton = await page.$('.updateButton');

        await updateButton.click();
        await page.waitForSelector('#todoModal', { visible: true });

        const selector = '#todoModalContent';
        
        const dataAttributes = await page.evaluate(selector => {
            const element = document.querySelector(selector);
            const dataAttrs = {};

            if (element) {
                for (const attr of element.attributes) {
                    if (attr.name.startsWith('data-')) {
                        dataAttrs[_.camelCase(attr.name)] = attr.value;
                    }
                }
            }
            
            return dataAttrs;
        }, selector);        

        const loremDescription = lorem.generateSentences(3);

        await page.type('#input-description', loremDescription);

        await page.click('#buttonUpdateTodo');
        await page.waitForSelector('table');

        const trElements = await page.$$('table tr');
        const lastTrElement = trElements[trElements.length - 1];

        const dataAttributesAfterUpdate = await page.evaluate(element => {
            return {
              dataTitle: element.getAttribute('data-title'),
              dataDescription: element.getAttribute('data-description'),
              dataUsername: element.getAttribute('data-username')
            };
          }, lastTrElement);

        expect(dataAttributesAfterUpdate.dataTitle).toBe(dataAttributes.dataTitle);
        expect(dataAttributesAfterUpdate.dataDescription).toBe(loremDescription);
        expect(dataAttributesAfterUpdate.dataUsername).toBe(dataAttributes.dataUsername);
    });
});