const puppeteer = require("puppeteer");
const email = require('./email')
// The domain of the target website
const domain = "https://wpi.studentemployment.ngwebsolutions.com/JobX_FindAJob.aspx?t=qs&qs=21";

async function checkDivContent(page) {
  try {
    // Wait for the div with ID "Skin_body_lvwJobs_pnlScroll" to be present in the DOM
    await page.waitForSelector('#Skin_body_lvwJobs_pnlScroll');

    // Locate the div with ID "Skin_body_lvwJobs_pnlScroll"
    const divContent = await page.$eval('#Skin_body_lvwJobs_pnlScroll', div => div.innerText);

    const jobSections = divContent.split("\n\n").filter(section => section.trim() !== '');

    const jobs = [];
    let currentJob = {};

    jobSections.forEach(section => {
      const lines = section.split("\n").map(line => line.trim()).filter(line => line !== '');

      lines.forEach(line => {
        if (line.startsWith('Employer:')) {
          currentJob.employer = line.replace('Employer: ', '');
        } else if (line.startsWith('Wage:')) {
          currentJob.wage = line.replace('Wage: ', '');
        } else if (line.startsWith('Openings:')) {
          currentJob.openings = line.replace('Openings: ', '');
        } else if (line.startsWith('Listed:')) {
          currentJob.listedDate = line.replace('Listed: ', '');
        } else if (line.startsWith('Hours:')) {
          currentJob.hours = line.replace('Hours: ', '');
        } else if (line.startsWith('Location:')) {
          currentJob.location = line.replace('Location: ', '');
        } else if (line.startsWith('Category:')) {
          currentJob.category = line.replace('Category: ', '');
        } else if (line.startsWith('Job Type:')) {
          currentJob.jobType = line.replace('Job Type: ', '');
          jobs.push(currentJob);
          currentJob = {};
        } else {
          if (!currentJob.title) {
            currentJob.title = line;
          }
        }
      });
    });

    // console.log();
    let nonFedralJobs = jobs.filter(val=> !val.jobType.toLowerCase().includes('federal') )
    if(nonFedralJobs.length){
        email.sendMail(JSON.stringify(nonFedralJobs, null, 2));
    }
  } catch (error) {
    console.log("The div with the specified ID was not found or there was an error parsing the content.", error);
  }
}

// Main function to manage the process
async function manageProcess() {
  // Launch a new browser instance
  const browser = await puppeteer.launch({ headless: false });

  // Open a new page in the browser
  const page = await browser.newPage();
  let minute = 15
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

        // Refresh the page
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        console.log("Page refreshed.");

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
  } finally {
    // Close the browser in case of errors or completion
    // await browser.close();
  }
}

// Call the main function to start the process
manageProcess();
