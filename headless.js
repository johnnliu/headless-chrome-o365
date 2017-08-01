const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const fs = require('fs');
const spauth = require('node-sp-auth');
const creds = require('./creds');

(async function () {

    // headless-chrome: https://developers.google.com/web/updates/2017/04/headless-chrome
    const chrome = await chromeLauncher.launch({
        // port: 9222, // Uncomment to force a specific port of your choice.
        chromeFlags: [
            '--window-size=412,732',
            '--disable-gpu',
            '--headless'
        ]
    });
    const protocol = await CDP({ port: chrome.port });

    // Extract the DevTools protocol domains we need and enable them.
    // See API docs: https://chromedevtools.github.io/devtools-protocol/
    const { Page, Network } = protocol;
    await Page.enable();
    await Network.enable();

    // node-sp-auth: https://github.com/s-KaiNet/node-sp-auth/wiki/SharePoint%20Online%20user%20credentials%20authentication
    var auth = await spauth.getAuth('https://johnliu365.sharepoint.com/', {
        username: creds.username,
        password: creds.password
    })

    // if you want to see auth header cookies
    console.log(auth.headers);

    Network.setExtraHTTPHeaders({
        "headers": auth.headers
    });
    Page.navigate({ url: 'https://johnliu365.sharepoint.com/SitePages/Home.aspx' });

    // Wait for window.onload before doing stuff.
    Page.loadEventFired(async () => {

        var data = await Page.printToPDF();

        //if you want to see base64 pdf
        console.log(data);

        fs.writeFile("test.pdf", data.data, "base64", function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });

        protocol.close();
        chrome.kill(); // Kill Chrome.
    });

})();