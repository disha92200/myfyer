
const express = require("express");
const bodyparser = require("body-parser");
const secret=require("./secret.js");

const csv=require("csv-parser");
const fs=require("fs");
const app = express();


app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
let candlelist = [];
let access_token = " ";
let auth = " ";


app.listen(8080, function () {
    console.log("Hello");
})

const fyers = require("fyers-api-v2");
const { setAccessToken } = require("fyers-api-v2");
fyers.setAppId(secret.app_ID)
fyers.setRedirectUrl('http://localhost:8080/auth');
/*auth_code : “This will be the response of the generateAuthCode method once you click 
on the redirect_url you will be provided with the auth_code”*/
fyers.generateAuthCode();

const url = "https://api.fyers.in/api/v2/generate-authcode?client_id="+secret.app_ID+"&redirect_uri=http://localhost:8080/auth&response_type=code&state=sample_state"



app.post("/download",function(req,res){
    res.download("stockdata.csv",function(err){
            console.log(err)
    })
})
app.get("/home", function (req, res) {
    res.render("fyers",{candles:candlelist});
   candlelist=[];

})

app.get("/", function (req, res) {
    res.redirect(url);
})
app.post("/home", function (req, res) {
    let stockname = req.body.sn;
    let timeframe = req.body.tf;
    let startdate = req.body.dr1;
    let lastdate = req.body.dr2;
    console.log(timeframe)
    if (timeframe === "1 day") {
        timeframe = "D";
    }
    else {
        timeframe = timeframe.split(" ");
        timeframe = timeframe[0];
    }
    console.log(timeframe)


    console.log(stockname, timeframe, startdate, lastdate);
    async function getHistory() {
        let history = new fyers.history()
        let result = await history.setSymbol(stockname)
            .setResolution(timeframe)
            .setDateFormat(1)
            .setRangeFrom(startdate)
            .setRangeTo(lastdate)
            .getHistory()
      

        const candlearray=result.candles;
        candlelist=Object.values(candlearray)
        res.redirect("/home");

        writeToCSVFile(candlelist)
    }  
    
        getHistory();



    })


app.get("/auth", function (req, res) {


    res.redirect("/home");
    auth = req.query.auth_code;
    console.log(auth)

    const reqBody = {
        auth_code: auth,
        secret_key: secret.secret_key
    }
    fyers.generate_access_token(reqBody).then((response) => {

        console.log(response)

        access_token = response.access_token;
        fyers.setAccessToken(access_token);

    });
});

  function writeToCSVFile(candlelists) {
    const filename = 'stockdata.csv';
    fs.writeFile(filename, extractAsCSV(candlelists), err => {
      if (err) {
        console.log('Error writing to csv file', err);
      } else {
        console.log(`saved as ${filename}`);
      }
    });
  }
  function extractAsCSV(candlelists) {
    const header = ["Epoc Time,Open value,Highest value,Lowest value,Close value,Volume"];
    const rows = candlelists.map(candle =>
       `${candle[0]}, ${candle[1]}, ${candle[2]},${candle[3]},${candle[4]},${candle[5]}`
    );
    return header.concat(rows).join("\n");
  }