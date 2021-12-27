const WebSocket = require('ws');
const axios = require('axios');
const udp = require("../helper/udp")
const webSocketWrapper = require("../socketWrapper/socketWrapper")

const tokenClass = require('../token/tokenGeneration')

const aPI='https://api.fyers.in/api/v2/'
const dataApi = 'https://api.fyers.in/data-rest/v2/'
const WS_URL='https://api.fyers.in/socket/v2/dataSock'
var _globalFyersDict={}
var _globalData=[]

let orderUpdateInstance;
let onSymbolUpdateInstance;


function unPackUDP(resp) {


  var FY_P_VAL_KEY = 'v';
  var FY_P_DATA_KEY = 'd';
  var FY_P_MIN_KEY = 'cmd';
  var FY_P_STATUS = 's';
  var that = this;
  try{
      var data_array_buffer = resp.data;
      var count = data_array_buffer.byteLength;
      var dictInfo = {};
      dictInfo[FY_P_STATUS] = 'ok';
      dictInfo[FY_P_DATA_KEY] = {};
      dictInfo[FY_P_DATA_KEY]['7202'] = [];
      dictInfo[FY_P_DATA_KEY]['7208'] = [];
      dictInfo[FY_P_DATA_KEY]['31038'] = [];
      var a = 0;
      var dataCount = 0;
      while(count>0){
        if(a >= 50){
          // console.log("break");
          break;
        }
        a+=1;
        var header = new DataView(data_array_buffer , 0 , 24);
        var cmn_data = '';
        var dataDict = {};
        // console.log("unPackUDP 3");
        var token = parseInt(header.getBigUint64(0));
        var fyCode = parseInt(header.getInt16(12));


        if(fyCode == 7202){
          if(token in _globalFyersDict){
            cmn_data = new DataView(data_array_buffer , 24 , 32);
            var oi = parseInt(cmn_data.getInt32(0));
            var pdoi = parseInt(cmn_data.getInt32(4));
            var changeInOI = Number(oi-pdoi);
            var percentChangeInOI = 0.0;
            if (pdoi == 0.0)
              {
                percentChangeInOI = 0.0;
              }
            else
              {
                percentChangeInOI = (changeInOI / pdoi) * 100;
              }
            dataDict[FY_P_STATUS] = 'ok';
            dataDict[FY_P_VAL_KEY] = {};
            dataDict[FY_P_VAL_KEY].oi = oi;
            dataDict[FY_P_VAL_KEY].pdoi = changeInOI;
            dataDict[FY_P_VAL_KEY].percentoi = percentChangeInOI.toFixed(2) + '%' ;
            dataDict.n = _globalFyersDict[token];
            dataDict.fy = token;
            dataDict.fycode = fyCode;
            dictInfo[FY_P_DATA_KEY]['7202'].push(dataDict);
            dataCount = 32;
            count = count - dataCount;
            data_array_buffer = data_array_buffer.slice(dataCount);
            }
          else {
            throw "Token "+token+" mapping not found";
            }
        }
        else if(fyCode == 31038){
          cmn_data = new DataView(data_array_buffer , 24 , 88);
          var price_conv = parseFloat(cmn_data.getInt32(0));
          var ltp = parseFloat(parseInt(cmn_data.getInt32(4)) / price_conv);

          var symbol_ticker = '';
          if(token in _globalFyersDict){
            symbol_ticker = _globalFyersDict[token].split(':');
            dataDict[FY_P_STATUS] = 'ok';
            dataDict[FY_P_VAL_KEY] = {};
            dataDict[FY_P_VAL_KEY].high_price = (parseInt(cmn_data.getInt32(12))/ price_conv).toString();
            dataDict[FY_P_VAL_KEY].prev_close_price = parseFloat(parseInt(cmn_data.getInt32(20))/ price_conv);
            dataDict[FY_P_VAL_KEY].ch = Number(parseFloat(ltp - dataDict[FY_P_VAL_KEY].prev_close_price).toFixed(2));
            dataDict[FY_P_VAL_KEY].tt = parseInt(header.getInt32(8)); // Timestamp sent by exchange
            dataDict[FY_P_VAL_KEY].description = _globalFyersDict[token];
            dataDict[FY_P_VAL_KEY].short_name = symbol_ticker[1]; //temp_value
            dataDict[FY_P_VAL_KEY].exchange = symbol_ticker[0];
            dataDict[FY_P_VAL_KEY].low_price = parseFloat(parseInt(cmn_data.getInt32(16)) / price_conv);
          // dataDict[FY_P_VAL_KEY].trans_code = fyCode;
          dataDict[FY_P_VAL_KEY].oi = parseInt(cmn_data.getBigUint64(48));
          var pdoi = parseInt(cmn_data.getBigUint64(56));
          var changeOI = Number(dataDict[FY_P_VAL_KEY].oi - pdoi);
          dataDict[FY_P_VAL_KEY].diffoi = changeOI;
          var percentChangeInOI = 0.0;
          if (pdoi == 0) {
              percentChangeInOI = 0.0;
            } else {
              percentChangeInOI = (changeOI / pdoi) * 100;
          }

          dataDict[FY_P_VAL_KEY].percentoi = percentChangeInOI.toFixed(2) + '%' ;
          dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY] = {};
          dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].c = parseFloat(parseInt(cmn_data.getInt32(36))/ price_conv);
          dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].h = parseFloat(parseInt(cmn_data.getInt32(28))/ price_conv);
          dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].l = parseFloat(parseInt(cmn_data.getInt32(32))/ price_conv);
          dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].o = parseFloat(parseInt(cmn_data.getInt32(24))/ price_conv);
          dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].t = parseInt(header.getInt32(8)) - (parseInt(header.getInt32(8)) % 60); // LTT
          dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].v = parseInt(cmn_data.getBigUint64(40));

          dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].tf = '';
          dataDict[FY_P_VAL_KEY].original_name = _globalFyersDict[token];
          dataDict[FY_P_VAL_KEY].chp = Number(parseFloat(((ltp - dataDict[FY_P_VAL_KEY].prev_close_price) / dataDict[FY_P_VAL_KEY].prev_close_price) * 100).toFixed(2)); // Percent change
          dataDict[FY_P_VAL_KEY].open_price = parseFloat(parseInt(cmn_data.getInt32(8))/ price_conv);
          dataDict[FY_P_VAL_KEY].lp = ltp; // LTP

          dataDict[FY_P_VAL_KEY].symbol = _globalFyersDict[token];
          dataCount = 88;

          var L2 = header.getInt8(18);
          var additional = new DataView(data_array_buffer , 88 , 120-88);
          dataCount = 120;
          dataDict[FY_P_VAL_KEY].LTQ = parseFloat(additional.getInt32(0));
          dataDict[FY_P_VAL_KEY].L2_LTT = parseInt(additional.getInt32(4));
          dataDict[FY_P_VAL_KEY].ATP = parseFloat(parseInt(additional.getInt32(8))/ price_conv);
          dataDict[FY_P_VAL_KEY].volume = parseInt(additional.getInt32(12));
          dataDict[FY_P_VAL_KEY].tot_buy = parseFloat(additional.getBigUint64(16));
          dataDict[FY_P_VAL_KEY].tot_sell = parseFloat(additional.getBigUint64(24));
          if (L2 == '1') {
              // console.log("unPackUDP 7");
              var bid = new DataView(data_array_buffer , 120 , 60);
              var ask = new DataView(data_array_buffer , 180 , 60);
              var bidList = [];
              var askList = [];
              var totBuy = dataDict[FY_P_VAL_KEY].tot_buy;
              var totSell = dataDict[FY_P_VAL_KEY].tot_sell;
              //New change 2019-0709 Palash
              for (var i = 0; i < 5; i++) {
                bidList.push({'volume':parseInt(bid.getInt32(i*12+4)), 'price':parseFloat(parseInt(bid.getInt32(i*12))/ price_conv), 'ord':parseInt(bid.getInt32(i*12 + 8))});
                askList.push({'volume':parseInt(ask.getInt32(i*12+4)), 'price':parseFloat(parseInt(ask.getInt32(i*12))/ price_conv), 'ord':parseInt(ask.getInt32(i*12 + 8))});
              }
              dataCount = 240;
              dataDict[FY_P_VAL_KEY].bid = bidList[0].price;
              dataDict[FY_P_VAL_KEY].ask = askList[0].price;
              var bidList_asc = bidList.reverse();
              var depth = {bids:bidList_asc,asks:askList,snapshot:true,totSell:totSell,totBuy:totBuy};
              // console.log(depth);
          } else {
              var bid_ask = new DataView(data_array_buffer , 120 , 8);
              dataDict[FY_P_VAL_KEY].bid = parseFloat(parseInt(bid_ask.getInt32(0)) / price_conv);
              dataDict[FY_P_VAL_KEY].ask = parseFloat(parseInt(bid_ask.getInt32(4)) / price_conv);
              dataCount = 128;
          }

          dataDict[FY_P_VAL_KEY].spread = parseFloat(dataDict[FY_P_VAL_KEY].ask) - parseFloat(dataDict[FY_P_VAL_KEY].bid);
          dataDict[FY_P_VAL_KEY].marketStat = parseInt(header.getInt16(14));
          dataDict.n = _globalFyersDict[token];
          dataDict.fy = token;
          dataDict.fycode = fyCode;
          dictInfo[FY_P_DATA_KEY]['31038'].push(dataDict);
          count = count - dataCount;
          data_array_buffer = data_array_buffer.slice(dataCount);
        } else {
          throw "Token "+token+" mapping not found";
        }
        }
        else if(fyCode != 7202 && fyCode != 31038){
          cmn_data = new DataView(data_array_buffer , 24 , 72-24);
          var price_conv = parseFloat(cmn_data.getInt32(0)); // 4bytes
          var ltp = parseFloat(parseInt(cmn_data.getInt32(4)) / price_conv);

          var symbol_ticker = '';
          if(token in _globalFyersDict) {
              symbol_ticker = _globalFyersDict[token].split(':');
              dataDict[FY_P_STATUS] = 'ok';
              dataDict[FY_P_VAL_KEY] = {};
              dataDict[FY_P_VAL_KEY].high_price = (parseInt(cmn_data.getInt32(12))/ price_conv).toString();
              dataDict[FY_P_VAL_KEY].prev_close_price = parseFloat(parseInt(cmn_data.getInt32(20))/ price_conv);
              dataDict[FY_P_VAL_KEY].ch = Number(parseFloat(ltp - dataDict[FY_P_VAL_KEY].prev_close_price).toFixed(2));// Previous change
              dataDict[FY_P_VAL_KEY].tt = parseInt(header.getInt32(8)); // Timestamp sent by exchange
              dataDict[FY_P_VAL_KEY].description = _globalFyersDict[token];
              dataDict[FY_P_VAL_KEY].short_name = symbol_ticker[1]; //temp_value
              dataDict[FY_P_VAL_KEY].exchange = symbol_ticker[0];
              dataDict[FY_P_VAL_KEY].low_price = parseFloat(parseInt(cmn_data.getInt32(16)) / price_conv);
              // dataDict[FY_P_VAL_KEY].trans_code = fyCode;
              dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY] = {};
              dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].c = parseFloat(parseInt(cmn_data.getInt32(36))/ price_conv);
              dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].h = parseFloat(parseInt(cmn_data.getInt32(28))/ price_conv);
              dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].l = parseFloat(parseInt(cmn_data.getInt32(32))/ price_conv);
              dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].o = parseFloat(parseInt(cmn_data.getInt32(24))/ price_conv);
              dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].t = parseInt(header.getInt32(8)) - (parseInt(header.getInt32(8)) % 60); // LTT
              dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].v = parseInt(cmn_data.getBigUint64(40));
              dataDict[FY_P_VAL_KEY][FY_P_MIN_KEY].tf = '';
              dataDict[FY_P_VAL_KEY].original_name = _globalFyersDict[token];
              dataDict[FY_P_VAL_KEY].chp = Number(parseFloat(((ltp - dataDict[FY_P_VAL_KEY].prev_close_price) / dataDict[FY_P_VAL_KEY].prev_close_price) * 100).toFixed(2)); // Percent change
              dataDict[FY_P_VAL_KEY].open_price = parseFloat(parseInt(cmn_data.getInt32(8))/ price_conv);
              dataDict[FY_P_VAL_KEY].lp = ltp; // LTP

              dataDict[FY_P_VAL_KEY].symbol = _globalFyersDict[token];
              dataCount = 72;
          if (fyCode == 7208) {
              var L2 = header.getInt8(18);
              var additional = new DataView(data_array_buffer , 72 , 104-72);
              dataCount = 104;
              dataDict[FY_P_VAL_KEY].LTQ = parseFloat(additional.getInt32(0));
              dataDict[FY_P_VAL_KEY].L2_LTT = parseInt(additional.getInt32(4));
              dataDict[FY_P_VAL_KEY].ATP = parseFloat(parseInt(additional.getInt32(8))/ price_conv);
              dataDict[FY_P_VAL_KEY].volume = parseInt(additional.getInt32(12));
              dataDict[FY_P_VAL_KEY].tot_buy = parseFloat(additional.getBigUint64(16));
              dataDict[FY_P_VAL_KEY].tot_sell = parseFloat(additional.getBigUint64(24));
              if (L2 == 1) {
                  // console.log("unPackUDP 7");
                  var bid = new DataView(data_array_buffer , 104 , 164-104);
                  var ask = new DataView(data_array_buffer , 164 , 224-164);
                  var bidList = [];
                  var askList = [];
                  var totBuy = dataDict[FY_P_VAL_KEY].tot_buy;
                  var totSell = dataDict[FY_P_VAL_KEY].tot_sell;
                  //New change 2019-0709 Palash
                  for (var i = 0; i < 5; i++) {
                    bidList.push({'volume':parseInt(bid.getInt32(i*12 + 4)), 'price':parseFloat(parseInt(bid.getInt32(i*12))/ price_conv), 'ord':parseInt(bid.getInt32(i*12 + 8))});
                    askList.push({'volume':parseInt(ask.getInt32(i*12 + 4)), 'price':parseFloat(parseInt(ask.getInt32(i*12))/ price_conv), 'ord':parseInt(ask.getInt32(i*12 + 8))});
                  }
                  dataCount = 224;
                  dataDict[FY_P_VAL_KEY].bid = bidList[0].price;
                  dataDict[FY_P_VAL_KEY].ask = askList[0].price;
                  var bidList_asc = bidList.reverse();
                  var depth = {bids:bidList_asc,asks:askList,snapshot:true,totSell:totSell,totBuy:totBuy};

              } else {
                var bid_ask = new DataView(data_array_buffer , 104 , 8);
                dataDict[FY_P_VAL_KEY].bid = parseFloat(parseInt(bid_ask.getInt32(0)) / price_conv);
                dataDict[FY_P_VAL_KEY].ask = parseFloat(parseInt(bid_ask.getInt32(4)) / price_conv);
                dataCount = 112;
              }
          } else {
            dataDict[FY_P_VAL_KEY].bid = ltp;
            dataDict[FY_P_VAL_KEY].ask = ltp;
          }
          dataDict[FY_P_VAL_KEY].spread = parseFloat(dataDict[FY_P_VAL_KEY].ask) - parseFloat(dataDict[FY_P_VAL_KEY].bid);
          dataDict[FY_P_VAL_KEY].marketStat = parseInt(header.getInt16(14));
          dataDict.n = _globalFyersDict[token];
          dataDict.fy = token;
          dataDict.fycode = fyCode;

          dictInfo[FY_P_DATA_KEY]['7208'].push(dataDict);

          count = count - dataCount;
          data_array_buffer = data_array_buffer.slice(dataCount);
        } else {
          throw "Token "+token+" mapping not found";
        }
        }
      }   // within while loop (end of while loop)
      // console.log(dictInfo);
      return dictInfo; // return statement
  } catch(err){
    var dictInfo = {};
    dictInfo[FY_P_STATUS] = 'err';
    dictInfo[FY_P_DATA_KEY] = [err];

    return dictInfo;
  }
};


const getSymbolData=async (ws,symbol,callback)=>{

    ws.send(JSON.stringify({T:"SUB_DATA", TLIST:symbol, SUB_T: 1}))
    ws.onmessage=(res)=>{
        let p=unPackUDP(res)

        if(p.s === "ok")
        {

          //getShata(p)
         // console.log(JSON.stringify(p))
          callback(JSON.stringify(p))
         // dispatch({"type":"SOCKET_PRELOAD_DATA_PL",data:{[props.symbol]:{lp:props.pl}}})


        }
    }


}

function onOrderUpdate(tokenValue, callback2, isUnsub = false) {
    let url = `${WS_URL}?access_token=${tokenValue}&user-agent=fyers-api&type=orderUpdate`
    let dataToSend = {"T": "SUB_ORD", "SLIST": ["orderUpdate"], "SUB_T": 1}

    if(isUnsub && orderUpdateInstance){
        dataToSend.SUB_T = 0;
        orderUpdateInstance.send(JSON.stringify(dataToSend))
        console.log("unsubscribed")
        return
    }else if(isUnsub){
        console.log("Error : Subscribe first");
        return;
    }

    orderUpdateInstance =  webSocketWrapper(url, JSON.stringify(dataToSend), function (data) {
        callback2(data.data)
    })
}

async function onSymbolUpdate(symbol, tokenValue, callback2, isUnsub = false) {
    const q = await getQuotes(symbol, tokenValue)

    if (false) {
        callback2(q)
    } else {
        let dataToSend = {T: "SUB_DATA", TLIST: symbol, SUB_T: 1}
        let url = `${WS_URL}?access_token=${tokenValue}&user-agent=fyers-api&type=symbolUpdate`
        if(isUnsub && onSymbolUpdateInstance){
            dataToSend.SUB_T = 0;
            onSymbolUpdateInstance.send(JSON.stringify(dataToSend))
            console.log("Unsubscribed")
            return
        }else if(isUnsub){
            console.log("Error : Subscribe first");
            return;
        }
        onSymbolUpdateInstance = webSocketWrapper(url, JSON.stringify(dataToSend), function (data) {
            let a = unPackUDP(data, symbol, tokenValue)
            callback2(JSON.stringify(a))
        })
    }
}

const connect = async (token, symbol, dataType, callback2, isUnsubscribe) => {
    let tokenValue = tokenClass.getAuthToken()
    if (dataType === 'orderUpdate') {
        onOrderUpdate(tokenValue, callback2, isUnsubscribe);
    } else if (dataType === 'symbolUpdate') {
        await onSymbolUpdate(symbol, tokenValue, callback2, isUnsubscribe);
    } else {
        return callback2('Please provide valid datatype')
    }
}


const getQuotes=async (symbol,token)=>{
  try{
    const quotes=await axios.get(`${aPI}quotes?symbols=${symbol.toString()}`,{
       headers:{
        Authorization:token
       }
    })
    const result=quotes.data

    if(result.d.length > 0)
    {
        for(var i=0;i<result.d.length;i++)
        {
          _globalFyersDict[result.d[i].v.fyToken]=result.d[i].n
        }

    }

    return quotes.data;
}
catch(e)
{

    return e.response.data
}

}
module.exports = {
    getGlobalFiresDict : _globalFyersDict,
    unPackUDP : unPackUDP,
    getQuotes : getQuotes,
    generateToken: (auth_token, appId) => {
        let token = auth_token.authorization_code
        let uri = aPI + 'genrateToken' + '?authorization_code=' + token + '&appId=' + appId
        return uri;
    },
    set_token: (auth_token) => {
        let token = auth_token.authorization_code;
        return token;
    },
    accessPoint: () => {
        return aPI;
    },
    dataAccessPoint: () => {
        return dataApi;
    },

   sha256:async (s) =>{
    var chrsz  = 8;
    var hexcase = 0;
    function safe_add (x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
    }
    function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
    function R (X, n) { return ( X >>> n ); }
    function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
    function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
    function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
    function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
    function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
    function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }
    function core_sha256 (m, l) {
    var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
    var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;
    m[l >> 5] |= 0x80 << (24 - l % 32);
    m[((l + 64 >> 9) << 4) + 15] = l;
    for ( var i = 0; i<m.length; i+=16 ) {
    a = HASH[0];
    b = HASH[1];
    c = HASH[2];
    d = HASH[3];
    e = HASH[4];
    f = HASH[5];
    g = HASH[6];
    h = HASH[7];
    for ( var j = 0; j<64; j++) {
    if (j < 16) W[j] = m[j + i];
    else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
    T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
    T2 = safe_add(Sigma0256(a), Maj(a, b, c));
    h = g;
    g = f;
    f = e;
    e = safe_add(d, T1);
    d = c;
    c = b;
    b = a;
    a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]);
    HASH[1] = safe_add(b, HASH[1]);
    HASH[2] = safe_add(c, HASH[2]);
    HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]);
    HASH[5] = safe_add(f, HASH[5]);
    HASH[6] = safe_add(g, HASH[6]);
    HASH[7] = safe_add(h, HASH[7]);
    }
    return HASH;
    }
    function str2binb (str) {
    var bin = Array();
    var mask = (1 << chrsz) - 1;
    for(var i = 0; i < str.length * chrsz; i += chrsz) {
    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
    }
    return bin;
    }
    function Utf8Encode(string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";
    for (var n = 0; n < string.length; n++) {
    var c = string.charCodeAt(n);
    if (c < 128) {
    utftext += String.fromCharCode(c);
    }
    else if((c > 127) && (c < 2048)) {
    utftext += String.fromCharCode((c >> 6) | 192);
    utftext += String.fromCharCode((c & 63) | 128);
    }
    else {
    utftext += String.fromCharCode((c >> 12) | 224);
    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
    utftext += String.fromCharCode((c & 63) | 128);
    }
    }
    return utftext;
    }
    function binb2hex (binarray) {
    var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    var str = "";
    for(var i = 0; i < binarray.length * 4; i++) {
    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
    hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8 )) & 0xF);
    }
    return str;
    }
    s = Utf8Encode(s);
    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
    },

    FyersConnect:(token,symbol,dataType,cl3, isUnsubscribe)=>{

      connect(token,symbol,dataType,cl3, isUnsubscribe)

    }


}

