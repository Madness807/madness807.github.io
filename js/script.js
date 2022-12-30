import tokenFile from "./42token.json" assert { type: "json" };
import update_front from './update_dom.js'

const TOKEN = "adb9b2051c5ce19f634d226a7d0db18e"

const ID_STATION = {
    lausanne_chauderon : 1970329131941987,
    renens_village     : 1970329131942234,
    renens_14_avril    : 1970329131942230,
    renens_gare        : 8501118
}

let data_buff = {
    train_renens: [],
    bus_renens:   [],
    bus_chauderon:     [],
    events_agenda: [],
    cluster_info: {asgard: "Wait", gotam: "Wait", ssd: "Wait"},
}

async function    get_data_from_id(station)
{
    return new Promise((resolve, reject)=>{
        fetch(`https://displays.api.sbb.ch:443/internal/api/v1/data/${station}?api_key=${TOKEN}`)
        .then(res => {if(!res.ok) throw Error(res.statusText); return res})
        .then(res => res.json())
        .then(data=> resolve(data))
        .catch(err=> reject(err));
    })
}

async function  get_data_to_id(stationA, stationB)
{
    return new Promise((resolve, reject)=>{
        fetch(`https://tl-apps.t-l.ch/new_interface/v3/schedules.json.cms?count=10&departure_stops=${stationA}&arrival_stops=${stationB}`)
        .then(res => {if(!res.ok) throw Error(res.statusText); return res})
        .then(res => res.json())
        .then(data=> resolve(data))
        .catch(err=> reject(err));
    })
}

async function  update_station_from(from, to)
{
    try{
        let data;
        
        data = await get_data_to_id(from, to);
        return (data.schedules.map(item=> ({
            departure: new Date(item.legs[0].stops[0].real_departure_time || item.departure_date),
            line: item.legs[0].line.number
        })));
    }
    catch(err)
    {
        return (["error"])
    }
}

async function  update_station_train(from)
{
    try{
        let data;

        data = await get_data_from_id(from);
        return (data.contents[0].verkehrsmittels.map(item =>
        ({
            to: item.ziele[0].betriebspunkt.ttsTexte.FR,
            category: item.vmArt,
            number: item.liniennummer,
            platform: item.gleisAbKb,
            departure: new Date(item.zeitAbErw || item.zeitAbKb)
        })))
    }
    catch(err)
    {
        return (["error"])
    }
}

async function  fetch_all_data()
{
    try{
        data_buff.bus_renens    = await update_station_from(ID_STATION.renens_village, ID_STATION.renens_14_avril)
        data_buff.bus_chauderon = await update_station_from(ID_STATION.renens_village, ID_STATION.lausanne_chauderon)
        data_buff.train_renens  = await update_station_train(ID_STATION.renens_gare)
        data_buff.events_agenda = await getevents();
    }
    catch(err)
    {
        console.error(err);
    }
}

function  init_timer_cluster_info()
{
    setInterval(()=>{
        fetch(`https://42lwatch.ch/clusters/`)
        .then(res => {if(!res.ok) throw Error(res.statusText); return res})
        .then(res => res.json())
        .then(data=> {
            data_buff.cluster_info.asgard = data.a;  //TODO TO CHANGE
            data_buff.cluster_info.gotam = data.b;
            data_buff.cluster_info.ssd = data.c;
        })
        .catch(err=>{
            data_buff.cluster_info.asgard = "Err";
            data_buff.cluster_info.gotam = "Err";
            data_buff.cluster_info.ssd = "Err"; 
        })}, 
    5 * 1000);
}

async function  init_timer_data_info()
{
    setInterval(async ()=>{
        data_buff.train_renens = await update_station_train(ID_STATION.renens_gare)
        console.log(data_buff);
        if (data_buff.bus_renens[0] != 'error' && data_buff.bus_renens[0].departure.getTime() - Date.now() < 60000)
        {
            data_buff.bus_renens.shift();
            if (data_buff.train_renens.length < 5)
                data_buff.bus_renens   = await update_station_from(ID_STATION.renens_village, ID_STATION.renens_14_avril)
        }
        if (data_buff.bus_renens[0] != 'error'  && data_buff.bus_chauderon[0].departure.getTime() - Date.now() < 60000)
        {
            data_buff.bus_chauderon.shift();
            if (data_buff.train_renens.length < 5)
                data_buff.bus_chauderon     = await update_station_from(ID_STATION.renens_village, ID_STATION.lausanne_chauderon)
        }
    }, 1000)
}


async function fetch_42_token()
{
    return new Promise((resolve, reject)=>{
        fetch(
            `https://api.intra.42.fr/oauth/token?grant_type=client_credentials&client_id=u-s4t2ud-d49d78b2b05ea39e40d350ad5aebe822cc5585e3d1177dffca11510b0f348afc&client_secret=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`,
            {method: 'POST'}
        )
        .then(res => {if(!res.ok) throw Error(res.statusText); return res})
        .then(res => res.json())
        .then(data=> resolve(data))
        .catch(err=> reject(err));
    })
}


async function    get_42_token()
{
    if (tokenFile != undefined && tokenFile != null)
        var token_data = tokenFile
    else {
        var token_data = await get_42_token();
        let fs = require('fs');
        fs.writeFile('42token.json', JSON.stringify(token_data), (err) => {
            if (err) throw err;
            console.log('The token file has been saved!');
        });
    }

    return (token_data);
}

async function getevents()
{
    const EVENT_ENDPOINT = 'https://api.intra.42.fr/v2/campus/47/events';
    let access_token = await get_42_token()['access_token'];
    new Promise((resolve, reject)=>{
        fetch(EVENT_ENDPOINT, {
                method: 'POST',
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${access_token}`
                }
            }
        )
        .then(res => {if(!res.ok) throw Error(res.statusText); return res})
        .then(res => res.json())
        .then(data=> console.log(data).then(resolve(data)))
        .catch(err=> reject(err));
    })
}

async function app()
{
    try{
        await fetch_all_data();
        //init_timer_cluster_info();  TODO 
        update_front(data_buff);
        init_timer_data_info();
    }
    catch(err)
    {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', function(event) {
    app();    
})

let myClock = new sbbUhr("clock", false, 60);
myClock.start()
