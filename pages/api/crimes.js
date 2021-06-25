import { dataDir, styleOptions, getParsedContent } from "../../config/crimes"
import { getChapters } from "../../util/wordExport"

export default (req, res) => {
  res.statusCode = 200;
  getChapters(dataDir, styleOptions, getParsedContent).then(chapters => {
    Promise.all(chapters).then(data => {
      res.json({ data: data.reduce((acc, cur) => {
        return [...acc, ...cur]
      }) });
    })
  })
};
