**This** is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

This site creates an api server to extract html content out of formatted word documents.

## Getting Started

First, run the development server:

```bash
npm run dev
# **or**
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

Below are the core directories and code files for this project.

- **config** : Contains config objects and functions related to a publication
- **data** : Contains the source word docs for each publication
- **pages** : pages at the root level display react based html pages. These can be useful for previewing documents.
- **pages/api** : these are the core api routes for each publication and will serve json content. Each publication will have an api route
- **util** : contains utility functions that can be used by all pages and api routes

## Overview

Each new publication will consist of 3 primary parts.
1. A data directory containing the word docs for the publication
2. A config file containing all of the unique data and functions for a publication
   - required exports: **dataDir, styleOptions, getParsedContent()**
3. An API route to serve the json output for the parsed content
## Config

The config files consist of all of the unique elements of a publication.

1. **dataDir** : This is the path to the word files in the data directory
2. **styleMap** : This is an object that map a word style to an html tag and class
   - see the mammoth.js link below for more info
3. **getParsedContent()** : This is a function that handles any post-processing required after exporting the content out of word. For crimes, this is the fuction the handles statute links and splitting the document up by header

There are three required exports from a config file:


Ex:

```js
  // path is used to create an absolute path to the data files
  import path from "path";

  // A parser can be import if additional post processing is required for a publication
  import { parse } from "node-html-parser";

  // Path to word docs in data directory
  export const dataDir = path.join(process.cwd(), "data/demo");

  // Style map to replace word styles with html tag and class. See link below for more info
  export const styleOptions = {
    styleMap: [
      "p[style-name='chapter TOC level 1'] => p.chapter-toc-lvl1:fresh",
    ],
  };

  // Optionally a node parser can be used to split the markup into individual fields
  // Return original markup if post-processing is not required
  export async function getParsedContent(markup) {
    return markup;
  }
```
Documentation on the StyleMap and the rest of Mammoth.js can be found here:
https://github.com/mwilliamson/mammoth.js#readme

Documentation on node-html-parser can be found here:
https://github.com/taoqf/node-html-parser

## Data

The **data** directory contains all of the word documents for a publication.

The file format should be **data/[publication name]**

All word docs within the publication directory will be parsed into html

## Pages

JavaScript files placed in the **pages** directory will receive automatic routes in the system. These can be useful for previewing content or displaying other information.

More information about page files can be found here: https://nextjs.org/docs/basic-features/pages

## API Routes

API routes are js files stored under **pages/api**

These are handled differently than normal pages and are central to the data import process. Each publication should have their own api route matching the publication name.

EX: pages/api/demo.js
```js
  // import options form the associated config
  import { dataDir, styleOptions, getParsedContent } from "../../config/demo";

  // import the getChapters function from wordUtils
  import { getChapters } from "../../util/wordExport";

  export default (req, res) => {
    // set response status code
    res.statusCode = 200;

    // parse the chapters and process the resulting promise
    getChapters(dataDir, styleOptions, getParsedContent).then((chapters) => {
      // resolve all promises are send data using res.json
      Promise.all(chapters).then((data) => {
        res.json({
          data: data.reduce((acc, cur) => {
            return [...acc, ...cur];
          }),
        });
      });
    });
  };
```

## Util

All of the utility function for the word export process are located in util/**wordExport.js**

These can be imported and used in the config and and api route for a publication.

The getChapters() function is the primary function call used to export markup from word.
