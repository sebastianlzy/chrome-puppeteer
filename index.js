const puppeteer = require('puppeteer');
const fs = require('fs');
const config = require('./config');

const main = async () => {

  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.setViewport({width: 1024, height: 869});
  const redirectLinks = {};
  let storeName = '';

  const goTo = async (url) => {
    try {
      return await page.goto(url)
    } catch (err) {

    }
  };

  const login = async () => {
    await goTo(config.loginUrl);
    await page.evaluate(() => {
      document.getElementById('First_name').value = config.username;
      document.getElementById('Last_name').value = config.password;
    });
    await page.waitFor(1000);
    await page.click('#login > div > div > div.steep2_detail > div > div:nth-child(2) > div > div.loader > input');
    return await page.waitFor(10000);
  };

  const getStoreLists = async () => {
    await goTo(config.storeListUrl);
    await page.waitFor(10000);
    return await page.evaluate(() => {
      const aElement = 'div.sitemap_list > ul > li > a';
      const resultSet = {};
      window.scrollTo(0, 1176);
      const linkBlocks = document.querySelectorAll(aElement);

      linkBlocks.forEach((link) => {
        const name = link.childNodes[1].nodeValue;
        resultSet[name] = link.href
      });
      return resultSet;
    });
  };

  const getRedirectLinks = async function (storeUrl) {
    await goTo(storeUrl);
    await page.waitFor(1000);
    const storeLink = await page.evaluate(() => {
      try {
        const selector = 'body > div.container-fluid.margin-top1 > div.page-bg-banner.common-page-background.coupons > div > div > div > div:nth-child(4) > div > div.brand-page-right > div.actions > div:nth-child(2) > input';
        const selected = document.querySelectorAll(selector);
        const regexp = /open\(\'(.*)\',/i;
        return selected[0].outerHTML.match(regexp)[1]
      } catch (err) {
        return '';
      }
    });
    if (storeLink === '') {
      return;
    }
    await goTo(`${config.baseUrl}${storeLink}`);
    return await page.waitFor(10000);
  };

  const onResponseHandler = (response) => {
    const redirectStatuses = [301, 302];
    if (redirectStatuses.includes(response.status)) {
      const regexp = new RegExp(/.*google.*/i);
      if (regexp.test(response.url)) {
        return;
      }

      if (!redirectLinks[storeName]) {
        redirectLinks[storeName] = [response.url];
      }
      if (redirectLinks[storeName] && redirectLinks[storeName].length < 10) {
        redirectLinks[storeName].push(response.url);
      }
    }
  };

  const writeToFile = () => {
    return new Promise((resolve, reject) => {
      fs.writeFile("output/result.json", JSON.stringify(redirectLinks), function (err) {
        if (err) {
          reject();
          return console.log(err);
        }

        console.log("The file was saved!");
        resolve();
      });
    })
  };

  await login();
  const allStoreLinks = await getStoreLists();

  await page.on('response', onResponseHandler);
  let i = 1;
  let total = Object.keys(allStoreLinks).length;

  for (let storeLinkName in allStoreLinks) {
    if (allStoreLinks.hasOwnProperty(storeLinkName)) {
      console.log(`${i}/${total}`);
      console.log('storeLinkName -', storeLinkName);
      console.log('url -', allStoreLinks[storeLinkName]);

      storeName = storeLinkName;
      await getRedirectLinks(allStoreLinks[storeLinkName]);
      await writeToFile();
    }
    i ++;
  }

  console.log('====================== COMPLETED ======================');
  await browser.close();
};

main();