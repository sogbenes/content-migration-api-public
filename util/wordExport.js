import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { fromFilePath } from "office-document-properties";

export function getChapterSlugs(dataDir) {
  return fs.readdirSync(dataDir).filter((slug) => {
    // Exclude temp word save files
    if (slug.startsWith("~$")) return false;
    // Exclude hidden files
    if (slug.startsWith(".")) return false;
    // Exclude non-word files
    if (!slug.endsWith(".docx")) return false;
    // Rainbows and sunshine
    return true;
  });
}

function convertToMetadata(path) {
  return new Promise((res, rej) => {
    fromFilePath(path, function (err, data) {
      res(data);
      if (err) {
        rej(err);
      }
    });
  });
}

export async function getDocumentMetaData(chapter) {
  const meta = await convertToMetadata(path.join(dataDir, chapter));
  return meta;
}

export async function getChapters(dataDir, styleMap, getParsedContent) {
  const chapters = getChapterSlugs(dataDir);
  const chapterData = chapters.map(async (chapter) => {
    const data = fs.readFileSync(path.join(dataDir, chapter));
    const markup = await mammoth.convertToHtml(data, styleMap);
    return getParsedContent(markup);
  });
  return chapterData;
}
