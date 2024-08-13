const express = require("express");
const tesseract = require("node-tesseract-ocr");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 5000;
const elasticClient = require("./elasticsearch_client");

const vieConfig = {
  lang: "vie",
};

const enConfig = {
  lang: "eng",
  psm: 1,
};

// Use CORS middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "20mb" }));

app.use(express.static("public"));
app.use("/images", express.static("images"));

const fs = require("fs");

// Ham chuyen base64String thanh hinh dinh dang jpg
const convertBase64StringToJpgImage = async (base64String) => {
  //console.log(base64String)

  // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
  const buffer = Buffer.from(base64String, "base64");

  fs.writeFileSync("./public/images/text_image.jpg", buffer);
};

app.get("/", (req, res) => {
  res.send("Hello World !");
});

app.get("/test-search", async (req, res) => {
  console.log("Get the book flow");
  const book = await elasticClient.search({
    index: "books",
    query: {
      bool: {
        should: [
          {
            match_phrase: {
              book_title: "THE WEALTH OF NATIONS",
            },
          },
          {
            match_phrase: {
              chapter_title: "THE WEALTH OF NATIONS",
            },
          },
        ],
      },
    },
  });

  console.log(book.hits.hits);
  //console.log(book.hits.hits[0]);
  res.json(book.hits.hits);
});

app.get("/popular-books", async (req, res) => {
  console.log("Get the book flow");
  const book = await elasticClient.search({
    index: "books",
    size: 21,
    query: {
      match_all: {},
    },
  });

  console.log(book.hits.hits.length);
  //console.log(book.hits.hits[0]);
  res.json({ books: book.hits.hits });
});

app.post("/search-book-by-text-term", async (req, res) => {
  console.log("search-book-by-text-term flow");
  console.log(req.body?.data?.searchTerm);
  const searchTerm = req.body?.data?.searchTerm;
  const book = await elasticClient.search({
    index: "books",
    size: 21,
    query: {
      match_phrase: {
        book_title: searchTerm,
      },
    },
  });

  console.log(book.hits.hits);

  res.json({ books: book.hits.hits });
});

app.post("/search", async (req, res) => {
  console.log("Get the book flow");

  const base64String = req.body?.data?.base64String;
  const language = req?.body?.data?.language;

  //Chuyển ảnh định dạng base64String thành jpg
  await convertBase64StringToJpgImage(base64String);

  //Chuyển ảnh định dạng tu jpg sang text bằng tesseract ocr
  if (language === "eng") {
    console.log("Chuyen doi theo he tieng Anh");
    tesseract
      .recognize("./public/images/text_image.jpg", enConfig)
      .then(async (text) => {
        console.log("Extract Text Result:");
        console.log(text);

        //Cắt bỏ khoảng trống và số khỏi text thu được : dùng text này để search trong elasticsearch
        const extractedChapterTitle = text.slice(0, text.indexOf("\n"));
        const extractedChapterTitleWithouNumber = extractedChapterTitle.replace(
          /[0-9]/g,
          ""
        );

        console.log(extractedChapterTitleWithouNumber);

        //phần text đoạn văn được trả về cho client
        const extractedText = text.slice(text.indexOf("\n"));

        const book = await elasticClient.search({
          index: "chapters",
          query: {
            bool: {
              should: [
                {
                  match_phrase: {
                    book_title: extractedChapterTitleWithouNumber,
                  },
                },
                {
                  match_phrase: {
                    chapter_title: extractedChapterTitleWithouNumber,
                  },
                },
              ],
            },
          },
        });

        console.log(book.hits.hits);

        //Kiểm tra sách chính xác nhất (highest score)
        let highestScore = book.hits.hits[0];

        for (let i = 1; i < book.hits.hits.length; i++) {
          if (book.hits.hits[i]["_score"] > highestScore) {
            highestScore = book.hits.hits[i];
          }
        }

        console.log("Sach chinh xac nhat");
        console.log(highestScore);

        //Chuyển dữ liệu về mobile client
        res.json({
          book: highestScore,
          text: extractedText,
        });
      })
      .catch((error) => {
        console.log(error.message);
      });
  } else {
    console.log("Chuyen doi theo he tieng Viet");
    tesseract
      .recognize("./public/images/text_image.jpg", vieConfig)
      .then((text) => {
        console.log("Result:", text);
        //chuyen ve frontend text
        res.send({ text: text });
      })
      .catch((error) => {
        console.log(error.message);
      });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
