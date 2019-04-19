'use strict';

// Import the Dialogflow module from the Actions on Google client library.
const {
    dialogflow,
    Suggestions
    /*,
      Permission*/
} = require('actions-on-google');
const http = require('http');
const request = require('request');
const host = 'https://smartmirror-api.azurewebsites.net';
const functions = require('firebase-functions');
const app = dialogflow({ debug: true });

var usuarioID = "";


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

const firstintent = 'Diary';
const secondintent = 'CloseDiary';
const thirdintent = 'ReadAgenda';

app.fallback((conv, params) => {
    const intent = conv.intent;
    switch (intent) {
        case firstintent:
            console.log(params);
            var orden = params.number;
            var orden2 = orden - 1;
            console.log(orden2, usuarioID);
            // usuarioID = usuarioID.replace('\'', '');
            console.log(orden2, usuarioID);
            return callUpdateDiaries(orden2, usuarioID).then(data => {
                return conv.ask(`Mostrando agenda ${orden}`);
            });
        case secondintent:
            console.log(usuarioID);
            return callApiOcultarAgenda(usuarioID).then(data => {
                return conv.ask(`Cerrando agenda`);
            });
        case thirdintent:
            console.log(usuarioID);
            return callApiGetLeerAgenda(usuarioID).then(data => {
                var description = data.description;
                var summary = data.summary;
                var location = data.location;
                var dateTime = data.dateTime;
                var respuesta = undefined;
                console.log()
                if (location !== null && description === null) {
                    respuesta = conv.ask(`${dateTime} ${summary} en ${location}`);
                } else if (location === null && description !== null) {
                    respuesta = conv.ask(`${dateTime} ${summary}. Como detalle adicional, ${description} `);
                } else if (location !== null && description !== null) {
                    respuesta = conv.ask(`${dateTime} ${summary} en ${location}. Como detalle adicional, ${description} `);
                } else if (location === null && description === null) {
                    respuesta = conv.ask(`${dateTime} ${summary}`);
                }
                return respuesta;
            })
        default:
            return conv.ask(`No entendí lo que me dijo, repita porfavor`);


    }

});

// return conv.ask(`oe wachi reconchetumadre, chibolo conchetumare, que chucha hablas
// que me has dejado con el ojo morao oe pavo conchetumare, ya no te acuerdas cuando estábamos en civa causa,
//  me insultastes a mi vieja causa, y cuando te avance con 5 puñetes ¿que hiciste?, ni pincho pavo conchetumare,
//   me quisistes tirar un tabazo, pero puse mi taba y te dolió mas a ti chibolo webon, si no hubiera sido por
//    Gino, que me dijo: ¡causa controlate!, te hubiera sacado la conchetumare, te hubiera roto la nariz encima
//     hubieras muerto oe concheutumadre, me distes pena pavo conchetumadre, ya no te acuerdas ¿cuando estábamos
//      en andahuaylas? y ¿cuando te defendí conchetumare?, cuando te querían robar tu baboso en la esquina, parao
//       como idiota conchetumadre, yo me acerque y los bote a esos webones porque te querían poner, pavo conchetumare
//        hasta para eso no eres vivo gil de mierda, tecleador de mierda y todavía me amenazaste, ¿ya no te acuerdas
//         cuando me amenazaste?, conchetumare, que me ibas a cortar la pierna, todavía mande la foto del escrinchot
//          conchetumare, sigo esperando que me cortes la pierna gil de mierda, eres un triste webon, por facebook
//           o whatsapp te crees maleante conchetumare, pero toda la gente sabe en persona que eres idiota, porque
//            crees que cuando fuimos a encontrarnos con Saul te hacia mierda, porque eres una cagada pe conchetumare, Saul
//             se dio cuenta que eres idiota, que eres apeligrao conchetumare, le tenias miedo a Saul porque te iba
//              avanzar idiota conchetumare, ¿para eso no eres pendejo?, ahí si eso no hablas chibolo conchetumare, gil
//               de mierda, eres un gil y morirás gil conchetumare, si quieres vamo encontrarnos en puente nuevo, vamo
//                a mecharnos pe conchetumare, pavo de mierda`);

function callUpdateDiaries(orden, usuarioid) {
    let data = JSON.stringify({ 'order': orden, 'userId': usuarioid });
    console.log(data);
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://smartmirror-api.azurewebsites.net/UpdateDiaries',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function(error, requestInternal, body) {
            resolve(body);
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
            resolve(body);
        });
    });
}

function callApiGetLeerAgenda(usuarioid) {
    let data = JSON.stringify({ userId: usuarioid });
    console.log(data);
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://smartmirror-api.azurewebsites.net/GetDiaryInformations',
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