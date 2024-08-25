const puppeteer = require("puppeteer");
const fs = require("fs");
const { exec } = require("child_process");

// The domain of the target website
const domain = "https://wpi.studentemployment.ngwebsolutions.com/JobX_FindAJob.aspx?t=qs&qs=21";

async function checkDivContent(page) {
  try {
    // Wait for the div with ID "Skin_body_lvwJobs_pnlScroll" to be present in the DOM
    await page.waitForSelector('#Skin_body_lvwJobs_pnlScroll');

    // Locate the div with ID "Skin_body_lvwJobs_pnlScroll"
    const jobElements = await page.$$('#Skin_body_lvwJobs_pnlScroll .panel.panel-default');

    const jobs = [];

    for (const jobElement of jobElements) {
      let job = {};

      job.title = await jobElement.$eval('.Bold_Link', el => el.innerText.trim());
      job.url = await jobElement.$eval('.Bold_Link', el => el.href.trim());

      // Use try/catch blocks for each field to handle missing elements
      try {
        job.employer = await jobElement.$eval('[id*="Employer"]', el => el.innerText.trim());
      } catch (e) {
        job.employer = "N/A";
      }

      try {
        job.wage = await jobElement.$eval('div.padded_faj strong:nth-of-type(1)', el => el.nextSibling.nodeValue.trim());
      } catch (e) {
        job.wage = "N/A";
      }

      try {
        job.openings = await jobElement.$eval('div.padded_faj strong:nth-of-type(2)', el => el.nextSibling.nodeValue.trim());
      } catch (e) {
        job.openings = "N/A";
      }

      try {
        job.listedDate = await jobElement.$eval('div.padded_faj strong:nth-of-type(3)', el => el.nextSibling.nodeValue.trim());
      } catch (e) {
        job.listedDate = "N/A";
      }

      try {
        job.hours = await jobElement.$eval('div.padded_faj strong:nth-of-type(4)', el => el.nextSibling.nodeValue.trim());
      } catch (e) {
        job.hours = "N/A";
      }

      try {
        job.location = await jobElement.$eval('div.padded_faj strong:nth-of-type(5)', el => el.nextSibling.nodeValue.trim());
      } catch (e) {
        job.location = "N/A";
      }

      try {
        job.category = await jobElement.$eval('div.padded_faj strong:nth-of-type(6)', el => el.nextSibling.nodeValue.trim());
      } catch (e) {
        job.category = "N/A";
      }

      try {
        job.jobType = await jobElement.$eval('div.padded_faj b', el => el.nextSibling.nodeValue.trim());
      } catch (e) {
        job.jobType = "N/A";
      }

      jobs.push(job);
    }

    // Write jobs data to output.json
    fs.writeFileSync('output.json', JSON.stringify(jobs, null, 2));

    // Automatically git commit and push the output.json file
    gitCommitAndPush();
    // let nonFederalJobs = jobs.filter(val => !val.jobType.toLowerCase().includes('federal'));

    // if (nonFederalJobs.length) {
    //   email.sendMail(JSON.stringify(nonFederalJobs, null, 2));
    // }
  } catch (error) {
    console.log("The div with the specified ID was not found or there was an error parsing the content.", error);
  }
}

function gitCommitAndPush() {
  exec('git add output.json', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error adding file to git: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);

    exec('git commit -m "Automated update of output.json"', (err, stdout, stderr) => {
      if (err) {
        console.error(`Error committing file: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);

      exec('git push', (err, stdout, stderr) => {
        if (err) {
          console.error(`Error pushing to repository: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      });
    });
  });
}

// Main function to manage the process
async function manageProcess() {
  // Launch a new browser instance
  const browser = await puppeteer.launch({ headless: false });

  // Open a new page in the browser
  const page = await browser.newPage();
  let minute = 15;

  // Navigate to the target domain
  try {
    await page.goto(domain, { waitUntil: "networkidle2" });

    // Initial check of the div content
    await checkDivContent(page);

    // Set interval to refresh the page and check the content every 15 minutes (15 * 60 * 1000 milliseconds)
    setInterval(async () => {
      try {
        let countdown = minute * 60; // 15 minutes in seconds
        const countdownInterval = setInterval(() => {
          const minutes = Math.floor(countdown / 60);
          const seconds = countdown % 60;
          console.log(`Time until next refresh: ${minutes}m ${seconds}s`);
          countdown--;

          if (countdown < 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);

        // Wait for 1 second before reload
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Refresh the page
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        console.log("Page refreshed.");

        // Check if the required element is still present
        await page.waitForSelector('#Skin_body_lvwJobs_pnlScroll', { timeout: 5000 });

        // Check the div content after the page reloads
        await checkDivContent(page);
      } catch (error) {
        console.log("Error during page refresh or content check:", error);
      }
    }, minute * 60 * 1000);

    // Keep the browser open
    await browser.waitForTarget(() => false);
  } catch (error) {
    console.log("Error during navigation or processing:", error);
  }
}


// Call the main function to start the process
manageProcess();
