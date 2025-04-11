/* eslint-disable no-console */
const fs = require('fs');
const ConstructorIOClient = require('@constructor-io/constructorio-node');
const Papa = require('papaparse');

// Workflow - Given a .csv file in the format | facet_option_id | position |, create the facet option slotting rules
// Step 1: Read the .csv file into the appropriate format Constructor expects
// Step 2: Upload the facet option configurations

console.info('Initializing...');

// 💡 Fill in your variables here!
const FACET_GROUP_NAME = 'sizes';                     // This should be the header sent in the feed, not the display name
const API_KEY = 'YOUR_INDEX_KEY';                     // Index key to create the slotting rules in.
const API_TOKEN = 'YOUR_API_TOKEN';                   // Secret used for Authentication. Can be obtained via the Constructor Dashboard. See: https://docs.constructor.com/docs/using-the-constructor-dashboard-monitoring-integration-status-api-tokens 
const CSV_FILEPATH = './facet-options-positions.csv'

const config = {
  apiKey: API_KEY,
  apiToken: API_TOKEN,
};
const client = new ConstructorIOClient(config);

// --- Step 1: Reading the .csv file -> [ {value: facetOptionId, position: 0}, ...]

async function readCsvToObj(
  path = 'test.csv',
  callback = (configs) => {
    console.info('parsing complete', configs);
  },
) {
  if (!fs.existsSync(CSV_FILEPATH)) {
      throw new Error("No .csv file found in CSV_FILEPATH")
  }

  const csvFileStream = fs.createReadStream(path);

  return new Promise((res) => {
    Papa.parse(csvFileStream, {
      header: true, // set to false if your .csv does not have a header
      complete: (results) => {
        const configs = [];
        const headers = results.meta.fields
        results.data.forEach((rawOption) => {
          let facetOption
          let position

          // We fix the first col as the facet option, regardless of the headers
          if (headers) {
            facetOption = rawOption[headers[0]]
            position = rawOption[headers[1]]

          } else {
            facetOption = rawOption[0]
            position = rawOption[1]
          }

          // Feel free to extend this to include other fields defined here:
          // https://docs.constructor.com/reference/v1-facet-options-create-facet-option
          configs.push(
            { 
              value: facetOption, 
              position,
            })
        });

        callback(configs);
        res(configs)
      },
    });
  });
}

// --- Step 2: Using the Constructor Node SDK, create the sort option configuration if it doesn't exist or patch if it does

async function uploadFacetOptionConfigs(facetGroupName, facetOptionConfigs) {
  try {
    // Facet Option Configuration requires a Facet Config to have already been created
    await client.catalog.addFacetConfiguration({
      name: facetGroupName,
      display_name: facetGroupName,
      type: 'multiple', // Slotting is typically only done for multiple facets
    });
  } catch (err) {
    // Facet Configuration already created
  }

  return client.catalog.addOrModifyFacetOptionConfigurations({
    facetGroupName,
    facetOptionConfigurations: facetOptionConfigs,
  });
}

// --- Run the steps
async function main() {
  console.info('\n-- Running Workflow: Creating Facet Option Slotting Rules --\n');

  console.info('Running Step 1 - Reading the csv file')
  const facetOptionConfigs = await readCsvToObj(CSV_FILEPATH)

  console.info('Running Step 2 - Uploading the facet option configs to Constructor')
  await uploadFacetOptionConfigs(FACET_GROUP_NAME, facetOptionConfigs)

  console.info('\n-- Workflow Complete --\n');
}

main()