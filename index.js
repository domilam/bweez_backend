const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoURI = require('./util/keys').mongoUrl;
const cors = require('cors'); // to enable CORS
const morgan = require('morgan'); // to manage log file
const bodyParser = require('body-parser'); // to parse body request */
const mongoose = require('mongoose');

const Image = require('./models/image');
const decodeBase64Image = require('./util/utils_func');

const app = express();

const date = new Date().toISOString().replace(/:/g,'_');

// create log file
const accesLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'), 
    {flags: 'a'}
);

//enable all CORS requests to be simple
app.use(cors());

//to stream log
app.use(morgan('combined', {stream: accesLogStream}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// route upload-image
app.post('/upload-image', (req, res, next)=>{
    const data = req.body;

    //decode image which is in base64
    const imageBuffer = decodeBase64Image(data.image)

    const fileName = path.join(__dirname, 'images', data.name+'_'+ date + '.jpeg');
    
    //create image file
    fs.writeFile(fileName, imageBuffer.data, function(err){
        if (err) return next(err);

        //create image mongodb and save
        const image = new Image({
            imageUrl: fileName
        });
        image.save()
        .then(result => {
            res.status(201).json({message: 'image enregistrée', data: image});
            console.log('Image enregistrée dans mongodb !!')
        })
        .catch(err => {
            res.status(422).json({message: 'erreur image non enregistrée !!', data: image});
        });
    });
});

app.use('/500', (req, res, next) => {
    res.status(500).json({message: 'error server'});
});
app.use((req, res, next) => {
    res.status(404).json({message: 'Page not found'});
});

mongoose.connect(mongoURI)
    .then((result)=>{
        app.listen(4000);
    })
    .catch((err)=>console.log(err));
