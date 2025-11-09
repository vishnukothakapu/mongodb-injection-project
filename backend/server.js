require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
// for input sanitization
// const mongoSanitizeInPlace = require('./utils/mongoSanitize');
const PORT = 8080;

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(mongoSanitizeInPlace());
const allowedOrigins = ('http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // allow requests with no origin (like curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: origin not allowed — ' + origin));
    }
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  optionsSuccessStatus: 204,
  credentials: false // set to true if you use cookies / sessions from frontend
};

app.use(cors(corsOptions));
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mongo_inject_demo')
.then(()=>console.log('MongoDB connected'))
.catch(e=>console.error(e));


app.use('/vuln', require('./routes/vuln'));
app.use('/secure', require('./routes/secure'));

if (process.env.ALLOW_VULN === '1') {
  console.warn('*** VULNERABLE ROUTES ENABLED - ONLY FOR LOCAL DEMO ***');
  app.use('/vuln', require('./routes/vuln'));
} else {
  console.log('VULN routes not mounted. Set ALLOW_VULN=1 to enable demo routes.');
}

app.get('/', (req,res)=>res.send('MongoDB Injection Demo'));
app.listen(PORT, ()=>console.log('server running http://localhost:'+PORT));