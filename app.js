const express = require('express');
const cors = require('cors');
const router = require('./routes/route');
const flash = require('connect-flash');
let session = require('express-session');
let bodyParser = require('body-parser');
const path = require("path");

require('dotenv').config();

let cookieParser = require('cookie-parser')
    // express-toastr
    , toastr = require('express-toastr');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('controllers'));
app.use(cors());
app.use(cookieParser('secret'));
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}))

app.use(flash());
app.use(toastr());
app.use('/', router);

app.listen(PORT, () => console.log(`Server started on port http://localhost:${PORT}/`))