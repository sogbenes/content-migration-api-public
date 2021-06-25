import path from "path";
import { styleOptions as crimesStyles } from "./crimes"

export const dataDir = path.join(process.cwd(), "data/demo");

export const styleOptions = crimesStyles;

export async function getParsedContent(markup) {
  // Todo parse
  return markup;
}
