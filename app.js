require('dotenv').config()
const axios = require('axios');
const QUOTE = 'USDT';
const AMOUNT = 10;
const PROFITABILITY = 1.00225;

const Binance = require('node-binance-api');
const binance = new Binance({
    APIKEY: "process.env.APIKEY",
    APISECRET: "process.env.APISECRET"
});

const BOOK = {};
binance.websockets.bookTickers((res) => {
    BOOK[res.symbol] = {
        ask: parseFloat(res.bestAsk),
        bid: parseFloat(res.bestBid)
    };
}) 



async function exchangeInfo(){
    let allSymbols = await binance.exchangeInfo()
    .then(response => {
        const symbols = response.symbols.filter(s => s.status === 'TRADING');
        return symbols.map(s => {
            return {
                symbol: s.symbol,
                base: s.baseAsset,
                quote: s.quoteAsset
            }
        })
    })
    return allSymbols;
}

function getBuyBuySell(buySymbols, allSymbols){
    const buyBuySell = [];

    for (let i=0; i < buySymbols.length; i++){
        const buy1 = buySymbols[i];

        const right = allSymbols.filter(s => s.quote === buy1.base);

        for(let j=0; j< right.length; j++){
            const buy2 = right[j];

            const sell1 = allSymbols.find(s => s.base === buy2.base && s.quote === buy1.quote);
            if(!sell1) continue;

            buyBuySell.push({buy1, buy2, sell1});
        }
    }
    return buyBuySell;    
}

function processBuyBuySell(buyBuySell){
    for(let i=0; i< buyBuySell.length; i++ ){
        const candidate = buyBuySell[i];

        let priceBuy1 = BOOK[candidate.buy1.symbol];
        if(!priceBuy1) continue;
        priceBuy1 = priceBuy1.ask;
        
        let priceBuy2 = BOOK[candidate.buy2.symbol];
        if(!priceBuy2) continue;
        priceBuy2 = priceBuy2.ask;
        
        let priceSell1 = BOOK[candidate.sell1.symbol];
        if(!priceSell1) continue;
        priceSell1 = priceSell1.bid;

        const crossRate = (1/priceBuy1) * (1/priceBuy2) * priceSell1;

        
        if(crossRate > PROFITABILITY){
            console.log(`Oportunidade em ${candidate.buy1.symbol} > ${candidate.buy2.symbol} > ${candidate.sell1.symbol} = ${crossRate} `);
        }
    }
}

async function process() {
    const allSymbols = await exchangeInfo();

    const buySymbols = allSymbols.filter(s => s.quote === QUOTE);

    const buyBuySell = getBuyBuySell(buySymbols, allSymbols);
    console.log("Existem " + buyBuySell.length + " Pares BBS");

    setInterval(() => {
        console.log(new Date());
        processBuyBuySell(buyBuySell);
    },3000)

}

process();







