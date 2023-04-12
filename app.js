const express = require('express');
const cors = require('cors');
const middlewares = require('./middlewares');
const router = require('./routes/index');
const flash = require('connect-flash');
var session = require('express-session');
var bodyParser = require('body-parser');

require('dotenv').config();

var cookieParser = require('cookie-parser')
    // express-toastr
    , toastr = require('express-toastr');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('controllers'));
app.use(cors());
app.use(middlewares.setHeaders);
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