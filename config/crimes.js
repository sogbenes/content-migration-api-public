import path from "path";
import { parse } from "node-html-parser";

export const dataDir = path.join(process.cwd(), "data/crimes");

export const styleOptions = {
  styleMap: [
    "p[style-name='chapter TOC level 1'] => p.chapter-toc-lvl1:fresh",
    "p[style-name='chapter TOC level 2'] => p.chapter-toc-lvl2:fresh",
    "p[style-name='chapter number'] => p.chapter-number:fresh",
    "p[style-name='chapter title'] => h1.chapter-title:fresh",
    "p[style-name='00 Heads->A head'] => h1.a-head:fresh",
    "p[style-name='00 Heads->B head'] => h2.b-head:fresh",
    "p[style-name='00 Heads->B after A'] => h2.b-head:fresh",
    "p[style-name='00 Heads->C head'] => h3.c-head:fresh",
    "p[style-name='statute title'] => p.statute-title:fresh",
    "p[style-name='statute body'] => p.statute-body:fresh",
    "p[style-name='statute list'] => p.statute-list:fresh",
    "p[style-name='statute list level 2'] => p.statute-list-lvl2:fresh",
    "p[style-name='statute list level 3'] => p.statute-list-lvl3:fresh",
    "p[style-name='BT list numbered (#)'] => ol > li.bt-list:fresh",
    "p[style-name='body list bullet'] => ul > li.bullet-list:fresh",
    "p[style-name='body indent'] => p.body-indent:fresh",
    "p[style-name='body indent before'] => p.body-indent-before:fresh",
    "p[style-name='body text hang ind Related Offenses'] => p.related:fresh",
    "p[style-name='New Statute List A Level'] => p.a-statute",
    "r[style-name='Text Italic'] => em",
    "r[style-name='Case Name Italic'] => em",
    "r[style-name='Small Caps'] => span.small-caps",
    "r[style-name='Statute -- Warnock Pro'] => span.statute",
    "r[style-name='Statute -- Myriad Pro Semicondensed'] => span.statute-semicondensed",
    "r[style-name='Statute -- Myriad Pro Semibold Semicondensed'] => span.statute-semibold-semicondensed",
    "p[style-name='statute body no indent'] => p.statute-body-no-indent:fresh",
    "p[style-name='body no indent'] => p.statute-body-no-indent:fresh",
    "p[style-name='D head after C head'] => p.d-head-after-c-head:fresh",
    "p[style-name='D head'] => p.d-head:fresh",
    "r[style-name='D head'] => span.d-head",
    "r[style-name='Case Name'] => span.case-name",
    "p[style-name='body list level 2'] => p.body-list-lvl-2:fresh",
    "p[style-name='Statute title space above'] => p.statute-title-space-above:fresh",
    "p[style-name='body list level 3'] => p.body-list-lvl-3:fresh",
    "p[style-name='Body text GS not reproduced'] => p.body-text-gs-not-reproduced:fresh",
  ],
};

export async function getParsedContent(markup) {
  const root = parse(markup.value);
  const chapterNumber = root.querySelector("p.chapter-number").innerText ?? "0";
  let sections = [];
  let status = "headers";
  let aHead,
    bHead,
    statute = "",
    elements = "",
    punishment = "",
    notes = "",
    related = "";
  root.childNodes.forEach((node, idx, array) => {
    switch (status) {
      // Process A and B Level Headers
      case "headers":
        if (node.classNames.includes("a-head")) {
          aHead = node.innerText;
        }
        if (node.classNames.includes("b-head")) {
          bHead = node.innerText;
        }
        if (
          node.classNames.includes("c-head") &&
          node.innerText.toLowerCase() === "statute"
        ) {
          status = "statute";
        }
        break;
      // Process Statute field
      case "statute":
        if (
          node.classNames.includes("c-head") &&
          node.innerText.toLowerCase() === "elements"
        ) {
          status = "elements";
        } else {
          statute += processNodeString(node).toString();
        }
        break;
      // Process elements field
      case "elements":
        if (
          node.classNames.includes("c-head") &&
          node.innerText.toLowerCase() === "punishment"
        ) {
          status = "punishment";
        } else {
          elements += node.toString();
        }
        break;
      // Process punishment field
      case "punishment":
        if (
          node.classNames.includes("c-head") &&
          node.innerText.toLowerCase() === "notes"
        ) {
          status = "notes";
        } else {
          punishment += node.toString();
        }
        break;
      // Process notes field
      case "notes":
        if (
          node.classNames.includes("c-head") &&
          node.innerText.toLowerCase() ===
            "related offenses not in this chapter"
        ) {
          status = "related";
        } else {
          notes += node.toString();
        }
        break;
      // Process related field
      case "related":
        if (
          idx === array.length - 1 ||
          array[idx + 1]?.classNames.includes("a-head") ||
          array[idx + 1]?.classNames.includes("b-head")
        ) {
          related += node.toString();
          const uri = (bHead ? bHead : aHead)
            .trim()
            .split(" ")
            .join("-")
            .toLowerCase();
          sections.push({
            aHead: aHead,
            bHead: bHead,
            statute: statute,
            elements: elements,
            punishment: punishment,
            notes: notes,
            related: related,
            uri: uri,
            chapter: chapterNumber,
            id: `ch${chapterNumber}-${uri}`,
          });
          bHead = statute = elements = punishment = notes = related = "";
          status = "headers";
        } else {
          related += node.toString();
        }
        break;
      default:
        break;
    }
  });
  return sections;
}

/**
 *
 * @param {*} node
 */
function processNodeString(node) {
  const statutes = node.querySelectorAll(".statute");
  if (statutes.length) {
    statutes.forEach((statute) => {
      const statuteText = statute.innerText;
      if (statuteText.startsWith("§")) {
        const link = getStatuteLink(statuteText);
        statute.set_content(statute.toString().replace(statuteText, link));
      }
    });
  } else {
    //todo
  }
  return node;
}

function getChapterNumber(statute, startChar = "§", endChar = "-") {
  // temp hack to fix endash
  if (endChar == "-" && statute.indexOf(endChar) == -1) {
    endChar = "‑";
  }
  return statute.slice(
    statute.indexOf(startChar) + 1,
    statute.indexOf(endChar)
  );
}

function getFirstNumberIndex(statute) {
  return [...statute].reduce((acc, cur, idx) => {
    if (!isNaN(acc)) return acc;
    if (!isNaN(cur)) return idx;
  });
}

function getLastNumberIndex(statute) {
  return [...statute].reduce((acc, cur, idx) => {
    return !isNaN(cur) ? idx : acc;
  });
}

function getNumericStatute(statute) {
  return statute.slice(
    getFirstNumberIndex(statute),
    getLastNumberIndex(statute) + 1
  );
}

function getStatuteUrl(chapter, code, prefix = "GS_") {
  return `https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_${chapter}/${prefix}${code}.html`;
}

function getStatuteLink(statute, startChar = "§", endChar = "-") {
  const chapter = getChapterNumber(statute);
  const code = getNumericStatute(statute);
  const url = getStatuteUrl(chapter, code);
  return `<a href="${url}">${statute}</a>`;
}
