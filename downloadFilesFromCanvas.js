const puppeteer = require('puppeteer');
const path = require('path');

// The domain of the Canvas LMS
const domain = "https://canvas.edu";

// The list of URLs to download files from
const urls = [
    'https://canvas.edu/courses/61938/files/6624431/download?download_frd=1',
    'https://canvas.edu/files/6634971/download'
];

// A utility function to introduce a delay
function delay(time = 60000) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

// Main function to download files
async function downloadFile() {
    // Launch a new browser instance
    const browser = await puppeteer.launch({ headless: false });

    // Open a new page in the browser
    const page = await browser.newPage();

    // Define the download path
    const downloadPath = path.join(process.cwd(), 'docs');

    // Set the download behavior to allow and specify the download path
    await page._client().send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: downloadPath
    });

    // Navigate to the main domain (assumed to be the Canvas login page)
    await page.goto(domain);

    // Wait for a specified amount of time (to manually login if necessary)
    await delay();

    // Loop through each URL to download the files
    for (const url of urls) {
        // Open a new page for each download URL
        const newPage = await browser.newPage();

        try {
            // Navigate to the download URL and wait until the download starts
            await newPage.goto(url, { timeout: 60000 });
        } catch (error) {
            // Log any navigation errors
            console.error('Navigation error:', error);
        }

        // Log a message indicating the download attempt is complete
        console.log("<<<<<<<<<<<<<<<<DONE>>>>>>>>>>>>>>");
    }
}

// Call the main function to start the download process
downloadFile();
