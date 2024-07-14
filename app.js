const elasticClient = require("./elasticsearch_client");
const tesseract = require("node-tesseract-ocr");
const path = require("path");

const enConfig = {
  lang: "eng",
};
const getBook = async () => {
  const book = await elasticClient.search({
    index: "books",
    query: {
      match: {
        chapter_title: "THE SCIENTIFIC REVOLUTION",
      },
    },
  });

  console.log(book.hits.hits);

  // let highestScore = book.hits.hits[0];

  // for (let i = 1; i < book.hits.hits.length; i++) {
  //   if (book.hits.hits[i]["_score"] > highestScore) {
  //     highestScore = book.hits.hits[i];
  //   }
  // }

  // console.log(highestScore);
};

//getBook();

const getDetailBook = async () => {
  const book = await elasticClient.get({
    index: "books",
    id: "3fbf7769-f0a4-416a-9d21-ae448ffe2f40",
  });

  console.log(book);
};

const str = `THE PLACE OF WOMEN IN THE STUDY OF SCIENCE

Most of this discussion of seventeenth-century science has focused on
the contributions of men of science; this was, however, a period when
women were attempting to make their mark on the study of the natural
world. Both Anne Finch, Viscountess of Conway (1631-79), and
Margaret Cavendish, Duchess of Newcastle, were interested in break-
ing into this previously clerical and male preserve. The same social
and intellectual upheaval that made science a gentlemanly pursuit gave
women a brief window of opportunity to become involved in natural
philosophy. Bethsua Makin (c. 1612-c. 1674) wrote An Essay to
Revive the Ancient Education of Gentlewomen (1673), arguing for
the might and ability of women to study natural philosophy. Anne
Conway corresponded with Leibniz and shared with him her theory of
“monads” that became the basis of his particulate philosophy of the
universe. Margaret Newcastle wrote many books of natural philosophy
and attended a meeting of the Royal Society. She also composed what
has been called the first English work of science fiction, The Description
of a New World, Called the Blazing World (1666). Both women, how-
vel, were exceptions. The seventeenth and eichteenth century cau;`

const result = str.slice(str.indexOf("\n"))

console.log(result)
//getDetailBook()

// const recognize = () => {
//   tesseract
//     .recognize("./public/images/images.png", enConfig)
//     .then((text) => {
//       console.log("Result:");

//       console.log(text)
//       console.log(typeof text)
//       console.log(text.length)
//     })
//     .catch((error) => {
//       console.log(error.message);
//     });
// };

// recognize();
