const express = require('express')
const tesseract = require("node-tesseract-ocr")
const app = express()
const cors = require('cors');
const bodyParser = require('body-parser')
const port = 5000

const vieConfig = {
    lang: "vie",
}

const enConfig = {
    lang: "eng",
}

// Use CORS middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json({ limit: '20mb' }));

app.use(express.static('public'));
app.use('/images', express.static('images'));

const fs = require("fs");

// Ham chuyen base64String thanh hinh dinh dang jpg
const convertBase64StringToJpgImage = async (base64String) => {
    
    //console.log(base64String)

    // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
    const buffer = Buffer.from(base64String, "base64");

    fs.writeFileSync("./public/images/text_image.jpg", buffer);
}


app.get('/', (req, res) => {
    res.send("Hello World Huy !")
})

app.post('/convert', async (req, res) => {

    const base64String = req.body?.data?.base64String
    const language = req?.body?.data?.language
    //console.log(req.body?.data?.base64String)

    console.log(language)

    //Chuyen base64String thanh jpg
    await convertBase64StringToJpgImage(base64String)

    //Chuyen tu hinh jpg sang text
    if(language === "en"){
        console.log("Chuyen doi theo he tieng Anh")
        tesseract
        .recognize("./public/images/text_image.jpg", enConfig)
        .then((text) => {
            console.log("Result:", text)
            //chuyen ve frontend text
            res.send({ text: text })
        })
        .catch((error) => {
            console.log(error.message)
        })
    }
    else {
        console.log("Chuyen doi theo he tieng Viet")
        tesseract
        .recognize("./public/images/text_image.jpg", vieConfig)
        .then((text) => {
            console.log("Result:", text)
            //chuyen ve frontend text
            res.send({ text: text })
        })
        .catch((error) => {
            console.log(error.message)
        })
    }

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})