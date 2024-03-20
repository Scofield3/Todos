const _ = require('lodash');
const pti = require('puppeteer-to-istanbul');
const schemaCreateTodo = require('../schemas/schema-create-todo.json');

describe("tests", () => {
    beforeAll(async () => {
        await Promise.all([
            page.coverage.startJSCoverage()
        ]);
    });

    afterAll(async () => {
        const [jsCoverage] = await Promise.all([
            page.coverage.stopJSCoverage()
        ]);
        
        pti.write([...jsCoverage], { includeHostname: true , storagePath: './.nyc_output' });
    });
    
    describe('Todos CREATE tests', () => {
        beforeEach(async () => {
            await page.goto('http://localhost:8000/dist/index.html');
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
        
        it('should create a new todo WITHOUT image', async () => {
            page.on('console', msg => {
                console.log('Page Log:', msg.text());
            });
        
            const todoText = "NEW TODO";
        
            await page.click('#readAllTodos');
            await page.waitForSelector('table');
        
            const searchColumnIndex = 1;
        
            const rows = await page.$$('table tbody tr');
        
            let rowToDelete;
        
            for (const row of rows) {
                const cell = await row.$('td:nth-child(' + (searchColumnIndex + 1) + ')');
                const cellText = await (await cell.getProperty('textContent')).jsonValue();

                if (cellText.trim() === todoText) {
                    rowToDelete = row;
                    break;
                }
            }
        
            if (rowToDelete) {
                const button = await rowToDelete.$('.deleteButton');

                await button.click();
            }
        
            await page.waitForSelector('table');
            await page.click('#createTodo');
            await page.waitForSelector('#todoModal', { visible: true });
        
            const requiredFields = [];
        
            _.forEach(schemaCreateTodo.required, function (requirement) {
                requiredFields.push('#input-' + requirement);
            });
        
            for (const field of requiredFields) {
                await page.type(field, todoText);
            }
        
            await page.click('#createTodoReq');        
            await page.waitForSelector('tr[data-title="' + todoText + '"');
        
            const trElements = await page.$$('table tr');
            const lastTrElement = trElements[trElements.length - 1];
        
            const dataAttributes = {};
        
            const properties = await lastTrElement.getProperties();

            for (const property of properties.values()) {
                const name = await (await property.getProperty('name')).jsonValue();
                const value = await (await property.getProperty('value')).jsonValue();
                dataAttributes[name] = value;
            }
        
            _.forEach(dataAttributes, attribute => {
                expect(attribute).toBe(todoText);
            });
        });
    });
});