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

// app.get('/ping-elastic', async (req, res) => {
//     const book = await elasticClient.get({
//         index: 'books',
//         id: '1f43feb0-ac1e-4ab3-b4d3-f9c417162e48',
//       })

//       console.log(book)

//     res.send("OK !")
// })

// app.post('/search', async (req, res) => {

//     const base64String = req.body?.data?.base64String
//     const language = req?.body?.data?.language
//     //console.log(req.body?.data?.base64String)

//     console.log(base64String)

//     //Chuyen base64String thanh jpg
//     await convertBase64StringToJpgImage(base64String)

//     //Chuyen tu hinh jpg sang text
//     if(language === "eng"){
//         console.log("Chuyen doi theo he tieng Anh")
//         tesseract
//         .recognize("./public/images/text_image.jpg", enConfig)
//         .then((text) => {
//             console.log("Result:", text)
//             //chuyen ve frontend text
//             res.send({ text: text })
//         })
//         .catch((error) => {
//             console.log(error.message)
//         })
//     }
//     else {
//         console.log("Chuyen doi theo he tieng Viet")
//         tesseract
//         .recognize("./public/images/text_image.jpg", vieConfig)
//         .then((text) => {
//             console.log("Result:", text)
//             //chuyen ve frontend text
//             res.send({ text: text })
//         })
//         .catch((error) => {
//             console.log(error.message)
//         })
//     }

// })
app.get("/e-search", async (req, res) => {
  console.log("Get the book flow");
  const book = await elasticClient.search({
    index: "books",
    query: {
      match: {
        chapter_title: "1008 THE WEALTH OF NATIONS",
      },
    },
  });

  console.log(book);
  res.json(book);
});

app.post("/search", async (req, res) => {
  console.log("Get the book flow");
  const book = await elasticClient.search({
    index: "books",
    query: {
      match: {
        chapter_title: "1008 THE WEALTH OF NATIONS",
      },
    },
  });

  console.log(book);

  const base64String = req.body?.data?.base64String;
  const language = req?.body?.data?.language;
  //console.log(req.body?.data?.base64String)

  //console.log(base64String)

  //Chuyen base64String thanh jpg
  await convertBase64StringToJpgImage(base64String);

  //Chuyen tu hinh jpg sang text
  if (language === "eng") {
    console.log("Chuyen doi theo he tieng Anh");
    tesseract
      .recognize("./public/images/text_image.jpg", enConfig)
      .then(async (text) => {
        console.log("Extract Text Result:");
        console.log(text);
        //console.log(text.slice(0, text.indexOf("\n")));

        const extractedChapterTitle = text.slice(0, text.indexOf("\n"));
        const extractedChapterTitleWithouNumber = extractedChapterTitle.replace(
          /[0-9]/g,
          ""
        );

        const extractedText = text.slice(text.indexOf("\n"));
        //console.log(extractedChapterTitleWithouNumber)

        const book = await elasticClient.search({
          index: "books",
          query: {
            match: {
              chapter_title: extractedChapterTitleWithouNumber,
            },
          },
        });

        console.log(book.hits.hits);

        //Kiem sach chinh xac nhat (highest score)
        let highestScore = book.hits.hits[0];

        // for (let i = 1; i < book.hits.hits.length; i++) {
        //   if (book.hits.hits[i]["_score"] > highestScore) {
        //     highestScore = book.hits.hits[i];
        //   }
        // }

        console.log("Sach chinh xac nhat");
        console.log(highestScore);

        //Chuyen ve frontend
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
