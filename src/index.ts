import { downloadFirstCataloguePage } from "./catalogue.js";

// Part 0
async function checkRobots() {
  const url = "https://books.toscrape.com/robots.txt";

  try {
    const response = await fetch(url);

    if (response.status === 404) {
      console.log("no robots file found");
      return;
    }

    if (!response.ok) {
      console.log(`Request failed with status ${response.status}`);
      return;
    }

    const text = await response.text();
    console.log(text);
  } catch (error) {
    console.error("Request error:", error);
  }
}

checkRobots();

//Part 1
downloadFirstCataloguePage();
