# Slotting Facet Options

In this example, we explore the need to programatically slot facet options to achieve the desired order in Constructor's Search/Browse API Responses.

## Considerations - Do I need to do this?

Constructor's algorithms already arranges facet options dynamically, according to the personalized intent of each customer. The Customer Dashboard also allows you to change the arrangement of facet options according to ["Number of matches" or "Alpha-numerically"](https://docs.constructor.com/docs/using-the-constructor-dashboard-configuring-rules-facets-configure-global-facets#range-1), and gives you the abiliy to slot individual facets if needed.

Given these options, we do not recommend programatically slotting your facet options unless:

1. The facet you're looking to sort on has a typical order users would expect it to be in (i.e. size) and,
2. The values for this facet options cannot be modified to fit the "Alpha-numeric" sort provided.

## How to use

1. Step 1: Prepare a .csv file that contains the list of facet options as ingested in your catalog feed, and the corresponding position to slot it. The csv file should have two columns:
   a. Column 1: The Facet Option to be slotted, as ingested in the catalog feed
   b. Column 2: The position the option should be slotted in

The file `facet-options-positions.csv` is provided as an example.

2. Step 2: Installing related dependencies. For this example, we'll be using the inbuilt `fs` package, alongside [Constructor's Node SDK](https://github.com/constructor-io/constructorio-node) to make API calls. [Papaparse](https://github.com/mholt/PapaParse) is also used to simplify CSV parsing.

```
npm ci
```

3. Step 3: Define the following top-level variables at the top of this script

| FACET_GROUP_NAME | The parent facet group whose options we're looking to slot |
| API_KEY | The [index key](https://docs.constructor.com/docs/faq-api-are-the-api-key-and-token-considered-secret#api-token) you're looking to configure |
| API_TOKEN | [How to generate an API Token](https://docs.constructor.com/docs/using-the-constructor-dashboard-monitoring-integration-status-api-tokens) |
| CSV_FILEPATH | Path to your `.csv` file |

4. Step 4: Run the script file. In the terminal, ensuring that you are in the same folder as the script, run:

```
npm run start
```

## Things to note

- Slotting fixes the facet option in place, w/o priority. This means that if you slot option A and option B in positions 1 and 2 respectively, `B` will remain in position 2 regardless of whether `A` exists position 1. In other words, if we only pin `A` and `B` but not `C`, since Constructor only returns valid facet options for the current result set, it is possible to have the following arrangement:

```
filter by Alphabet
  [ ] - C
  [ ] - B
  ...
```
