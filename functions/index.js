'use strict';

// Import the Dialogflow module from the Actions on Google client library.
const {
    dialogflow
    /*,
      Permission*/
} = require('actions-on-google');
const http = require('http');
const request = require('request');
const host = 'https://smartmirror-api.azurewebsites.net';
const functions = require('firebase-functions');
const app = dialogflow({ debug: true });

var usuarioID = undefined;


function callApiUsuario() {

    const options = {
        url: 'http://smartmirror-api.azurewebsites.net/GetUser',
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber: 140 })
    };

    request(options, function(error, requestInternal, body) {
        let usuario = JSON.parse(body);
        usuarioID = usuario.id;
    });

}
callApiUsuario();

app.intent('Diary', (conv, params) => {

    console.log(params);
    var orden = params.number;
    var orden2 = orden - 1;
    console.log(orden2, usuarioID);
    usuarioID = usuarioID.replace('\'', '');
    console.log(orden2, usuarioID);
    return callUpdateDiaries(orden2, usuarioID).then(data => {
        return conv.ask(`Mostrando agenda ${orden}`);
    })


});


app.intent('CloseDiary', (conv) => {


    usuarioID = usuarioID.replace('\'', '');
    console.log(usuarioID);
    return callApiOcultarAgenda(usuarioID).then(data => {
        return conv.ask(`Cerrando agenda`);
    })

});


function callUpdateDiaries(orden, usuarioid) {
    let data = JSON.stringify({ order: orden, userId: usuarioid });
    console.log(data);
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://smartmirror-api.azurewebsites.net/UpdateDiaries',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function(error, requestInternal, body) {
            resolve(JSON.parse(body));
        });
    });
}

function callApiOcultarAgenda(usuarioid) {
    let data = JSON.stringify({ userId: usuarioid });
    console.log(data);
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://smartmirror-api.azurewebsites.net/SetAllDiary',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function(error, requestInternal, body) {
            resolve(JSON.parse(body));
        });
    });
}
// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);