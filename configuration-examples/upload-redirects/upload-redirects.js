const fs = require('fs');
const ConstructorIOClient = require('@constructor-io/constructorio-node');
const Papa = require('papaparse');

// Workflow - Given a .csv file in the format: | url | exact_matches | phrase_matches | unordered_matches |, create the redirect rules
// Step 1: Read the .csv file into the appropriate format Constructor expects
// Step 2: Upload the redirects

console.info('Initializing...');

// 💡 Fill in your variables here!
const INDEX_KEY = 'YOUR_INDEX_KEY'; // Index key to create the slotting rules in.
const API_TOKEN = 'YOUR_API_TOKEN'; // Secret used for Authentication. Can be obtained via the Constructor Dashboard. See: https://docs.constructor.com/docs/using-the-constructor-dashboard-monitoring-integration-status-api-tokens
const CSV_FILEPATH = './WIP';
const TERM_DELIMITER = '|';

const config = {
  apiKey: INDEX_KEY,
  apiToken: API_TOKEN,
};
const client = new ConstructorIOClient(config);

// --- Step 1: Reading the .csv file -> [ {url: urlString, matches: [...]}, ...]

function splitTermsByDelimiter(terms) {
  return (
    terms
      ?.split(TERM_DELIMITER)
      ?.map((term) => term.trim())
      ?.filter((term) => term !== '') || []
  );
}

function onParsingComplete(results) {
  const redirectRules = [];
  const headers = results.meta.fields;

  results.data.forEach((rawOption) => {
    let url;
    let matchesArr = [];
    const exactMatches = [];
    const phraseMatches = [];
    const unorderedMatches = [];

    if (headers) {
      url = rawOption.url;
      exactMatches.push(
        ...splitTermsByDelimiter(rawOption.exact_matches)
      );
      phraseMatches.push(
        ...splitTermsByDelimiter(rawOption.phrase_matches)
      );
      unorderedMatches.push(
        ...splitTermsByDelimiter(rawOption.unordered_matches)
      );
    } else {
      // We follow the defined format order: 1. url, 2. exact_matches, 3. phrase_matches, 4. unordered_matches
      url = rawOption[0];
      exactMatches.push(...splitTermsByDelimiter(rawOption?.[1]));
      phraseMatches.push(...splitTermsByDelimiter(rawOption?.[2]));
      unorderedMatches.push(...splitTermsByDelimiter(rawOption?.[3]));
    }

    matchesArr.push(
      ...exactMatches.map((term) => ({
        pattern: term,
        match_type: 'EXACT',
      })),
      ...phraseMatches.map((term) => ({
        pattern: term,
        match_type: 'PHRASE',
      })),
      ...unorderedMatches.map((term) => ({
        pattern: term,
        match_type: 'UNORDERED',
      }))
    );

    // Maximum number of patterns is 300 per redirect rule object
    matchesArr = matchesArr.slice(0, 300)

    // Feel free to extend this to include other fields defined here:
    // https://docs.constructor.com/reference/v1-redirects-create-redirect-rule
    redirectRules.push({
      url,
      matches: matchesArr,
    });
  });

  return redirectRules
}

async function readCsvToObj(
  path = CSV_FILEPATH,
  callback = (redirectRules) => {
    console.info(`Parsing complete. ${redirectRules.length} rules read. Sample redirect rule:`);
    console.dir(redirectRules[0])
  }
) {
  if (!fs.existsSync(CSV_FILEPATH)) {
    throw new Error(`No .csv file found in CSV_FILEPATH=${CSV_FILEPATH}`);
  }

  const csvFileStream = fs.createReadStream(path);

  return new Promise((res, rej) => {
    Papa.parse(csvFileStream, {
      header: true, // set to false if your .csv does not have a header
      complete: (results) => {
        try {
          const redirectRules = onParsingComplete(results)

          callback(redirectRules);
          res(redirectRules);
        } catch (err) {
          console.error(err);
          rej(err);
        }
      },
    });
  });
}

// --- Step 2: Using the Constructor Node SDK, create the redirect rules if it doesn't exist or replace if it does

async function uploadRedirects(redirects) {
  if (!redirects) {
    throw new Error('Missing Redirects object');
  }

  const responses = [];
  for (const redirect of redirects) {
    // eslint-disable-next-line no-await-in-loop
    await client.catalog
      .addRedirectRule(redirect)
      .then((res) => responses.push(res))
      .catch((err) => {
        console.log(`Error for redirect: ${JSON.stringify(redirect)}`);
        throw new Error(err);
      });
  }

  return true;
}

// --- Run the steps
async function main() {
  console.info('\n-- Running Workflow: Creating Redirect Rules --\n');

  console.info('Running Step 1 - Reading the csv file');
  const redirects = await readCsvToObj();

  console.info('Running Step 2 - Uploading the redirect rules to Constructor')
  await uploadRedirects(redirects)

  console.info('\n-- Workflow Complete --\n');
}

main();
