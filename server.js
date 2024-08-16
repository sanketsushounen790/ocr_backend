const fs = require("fs");
const express = require("express");
const tesseract = require("node-tesseract-ocr");
const app = express();

const cors = require("cors");
const bodyParser = require("body-parser");

const port = 5000;
const elasticClient = require("./elasticsearch_client");

//Cấu hình TesseractOCR
const enConfig = {
  lang: "eng", // nhận dạng với ngôn ngữ tiếng Anh
  psm: 1, // Hỗ trợ xoay ảnh 360 độ
};

// Use CORS middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "20mb" }));

//Use static public assets
app.use(express.static("public"));
app.use("/images", express.static("images"));

// Hàm chuyển đổi dịnh dạng ảnh base64String thành dịnh dạng ảnh .jpg
const convertBase64StringToJpgImage = async (base64String) => {
  // Chuyển đổi ảnh base64String thành buffer => <Buffer ff d8 ff db 00 43 00 ...
  const buffer = Buffer.from(base64String, "base64");

  //Lưu ảnh trong thư mục public
  fs.writeFileSync("./public/images/text_image.jpg", buffer);
};

//route để kiểm tra server
app.get("/", (req, res) => {
  res.send("Hello World !");
});

//route query một số sách để hiển thị trên feed
app.get("/popular-books", async (req, res) => {
  console.log("Get popular books flow");
  const book = await elasticClient.search({
    index: "books",
    size: 29,
    query: {
      match_all: {},
    },
  });

  console.log(book.hits.hits);

  res.json({ books: book.hits.hits });
});

//route search sách bằng tên của sách
app.post("/search-book-by-text-term", async (req, res) => {
  console.log("Search book by text term flow");

  const searchTerm = req.body?.data?.searchTerm;

  console.log("Search Term: ", searchTerm);

  const book = await elasticClient.search({
    index: "books",
    size: 29,
    query: {
      match_phrase: {
        book_title: searchTerm,
      },
    },
  });

  console.log(book.hits.hits);

  res.json({ books: book.hits.hits });
});

//route để chuyển đổi hình ảnh trang sách từ .jpg sang text và tìm kiếm sách bằng tên chapter hoặc tên sách
app.post("/search", async (req, res) => {
  console.log("Server đã nhận được yêu cầu");

  const base64String = req.body?.data?.base64String;
  const language = req?.body?.data?.language;

  //Chuyển ảnh định dạng base64String thành jpg
  await convertBase64StringToJpgImage(base64String);

  //Chuyển ảnh định dạng tử .jpg sang text bằng TesseractOCR
  if (language === "eng") {
    console.log("Server đang thực hiện chuyển đổi hình ảnh và tìm kiếm...");
    tesseract
      .recognize("./public/images/text_image.jpg", enConfig)
      .then(async (text) => {
        console.log("Kết quả chuyển đổi hình .jpg sang text");
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

        console.log("Sách có điểm cao nhất");
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
  }
});

app.listen(port, () => {
  console.log(`Server đang chạy trên port ${port}`);
});
