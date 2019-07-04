'use strict';

const {
    dialogflow,
    Suggestions
    
} = require('actions-on-google');
const http = require('http');
const request = require('request');
const host = 'https://smartmirror-api.azurewebsites.net';
const functions = require('firebase-functions');
const app = dialogflow({ debug: true });

const EmailWidgetID = '26FE2DC3-ECA3-4199-95EB-08AF8089C40E';
const WeatherWidgetID = '99F9DFB0-69B3-4E32-8456-56AA76BADC2C';
const NewsWidgetID = 'D46FD00C-746D-4A11-A90A-5928EEC511CA';
const HotelServicesWidgetID = 'E7A12A8D-6514-43EB-9C6C-71A0180D0B81';
const MusicWidgetID = '11E19DA1-546C-45FB-8B9E-B2BD6E91FC73';
const DiaryWidgetID = '5A3179B9-A0D6-4110-907B-C9217911EA42';


var mirrorID = 1;
var userID = "";
var roomNumber = undefined;

function callApiUser() {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/GetUser',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ mirrorId: mirrorID })
        };

        request(options, function (error, requestInternal, body) {
            let user = JSON.parse(body);
            userID = user.id;
            roomNumber = user.roomNumber;
            resolve(user);
        });
    });
}

callApiUser();

const showDiary = 'Diary';    
const closeDiary = 'CloseDiary'; 
const readDiary = 'ReadAgenda';
const readEmail = 'ReadEmail';
const readNews = 'ReadNews';
const startEmail = 'StartEmail'; 
const updateServicesHotel = 'UpdateServicesHotels';
const closeServicesHotel = 'CloseServiceHotel';
const bookService = 'BookService';
const bookServiceYes = 'BookServiceYes'; 
const bookServiceYesCustom = 'BookServiceYesCustom';
const musicWidget = 'Music';

var serviceIDGlobal = undefined;
var stayIDGlobal = undefined;


app.fallback((conv, params) => {
    const intent = conv.intent;
    switch (intent) {
        case musicWidget:
            return callApiUser().then(result => {
                var action = params.action;                
                if (result.status === false) {

                    return UpdateActionMusicNoUser(action, mirrorID).then(result => {
                        let response = undefined;
                        if (action.toLocaleLowerCase() === 'pausar') {
                            response = conv.ask(`Pausando música`);

                        } else if (action.toLocaleLowerCase() === 'reproducir') {
                            response = conv.ask(`Reproduciendo música`);

                        } else if (action.toLocaleLowerCase() === 'adelantar') {
                            response = conv.ask(`Música siguiente`);
                        } else if (action.toLocaleLowerCase() === 'retroceder') {
                            response = conv.ask(`Música previa`);
                        } else {
                            response = conv.ask(`No entendí lo que me dijo, repita porfavor`);
                        }
                        return response;

                    })
                } else {
                    return GetStateWidget(MusicWidgetID, userID).then(data => {

                        if (data.status) {
                            return UpdateActionMusic(action, mirrorID, userID).then(result => {
                                let response = undefined;
                                if (action.toLocaleLowerCase() === 'pausar') {
                                    response = conv.ask(`Pausando música`);

                                } else if (action.toLocaleLowerCase() === 'reproducir') {
                                    response = conv.ask(`Reproduciendo música`);

                                } else if (action.toLocaleLowerCase() === 'adelantar') {
                                    response = conv.ask(`Música siguiente`);
                                } else if (action.toLocaleLowerCase() === 'retroceder') {
                                    response = conv.ask(`Música previa`);
                                } else {
                                    response = conv.ask(`No entendí lo que me dijo, repita porfavor`);
                                }
                                return response;

                            })
                        } else {
                            response = conv.ask(`El widget de música se encuentra deshabilitado`);
                            return response;
                        }
                    });


                }
            })

        case bookServiceYesCustom:
            var date = params.date;
            var hour = params.time;
            date = date.substring(0, 11);
            hour = hour.substring(11, 19);
            var realdate = date + hour;
            return BookService(stayIDGlobal, serviceIDGlobal, realdate, 0).then(result => {
                let response = undefined;
                if (result.status === 'Created') {
                    response = conv.ask(`La reserva fue realizada exitosamente`);
                } else{
                    response = conv.ask(`Hubo un problema al realizar la reserva`);
                }
                return response;
            })

        case bookServiceYes:
            return getServiceInformation(serviceIDGlobal).then(object => {
                let serviceTypeID = object.result.serviceType.serviceTypeId;
                if (serviceTypeID === 3) {
                    return conv.ask(`Consultando los platos`);
                } else {
                    return conv.ask(`Ingrese la hora y fecha de la reserva`);
                }
            });


        case bookService:

            return callApiUser().then(response => {
                var order1 = params.number;
                var order2 = order1 - 1;
                if (response.status === false) {

                    callApiHideHotelServicesNoUser(mirrorID);
                    return getServicesHotel().then(data => {
                        let array = [];
                        let objaux = undefined;
                        array = data.result.list;
                        for (var i = 0; i < array.length; i++) {
                            if (order2 === i) {
                                objaux = array[i];
                            }
                        }
                        serviceIDGlobal = objaux.serviceId;                        
                        return getHotelRoomByMirrorID(mirrorID).then(room => {
                            stayIDGlobal = room.result.estanciaId;                            
                            return getServiceInformation(objaux.serviceId).then(object => {
                                return conv.ask(`¿Está seguro de reservar el servicio de ${object.result.serviceType.name} ${object.result.name}?`);
                            })
                        })


                    });
                } else {
                    return GetStateWidget(HotelServicesWidgetID, userID).then(data => {
                        if (data.status) {
                            callApiHideDiary(userID);
                            callApiHideHotelServices(userID);
                            return getServiceIDByOrder(userID, order2).then(result => {
                                serviceIDGlobal = result.serviceId;
                                return getMirrorIDReservation(roomNumber).then(data => {
                                    stayIDGlobal = data.result.estanciaId;
                                    return getServiceInformation(serviceIDGlobal).then(object => {
                                        return conv.ask(`¿Está seguro de reservar el servicio de ${object.result.serviceType.name} ${object.result.name}?`);
                                    })

                                });
                            });
                        } else {
                            return conv.ask(`El widget de servicios del hotel se encuentra deshabilitado`);
                        }
                    });


                }


            })

        case closeServicesHotel:            
            return callApiUser().then(response => {
                if (response.status === false) {
                    return callApiHideHotelServicesNoUser(mirrorID).then(data => {
                        if (userID === '') {
                            return conv.ask(`Ingrese el número de habitación primero`);
                        } else {
                            return conv.ask(`Cerrando información de servicio`);
                        }
                    });
                } else {
                    return GetStateWidget(HotelServicesWidgetID, userID).then(data => {
                        if (data.status) {
                            return callApiHideHotelServices(userID).then(data => {
                                if (userID === '') {
                                    return conv.ask(`Ingrese el número de habitación primero`);
                                } else {
                                    return conv.ask(`Cerrando información de servicio`);
                                }
                            });
                        } else {
                            return conv.ask(`El widget de servicios del hotel se encuentra deshabilitado`);
                        }
                    })


                }

            });
        case updateServicesHotel:

            return callApiUser().then(response => {
                var order1 = params.number;
                var order2 = order1 - 1;                
                if (response.status === false) {                    
                    return callUpdateHotelServicesNoUser(order2, mirrorID).then(data => {
                        
                        return getServiceInformation(data.serviceId).then(result => {
                            let object = result;
                            return conv.ask(`${object.result.serviceType.name} ${object.result.name}. ${object.result.description}`);

                        });
                    });
                } else {

                    return GetStateWidget(HotelServicesWidgetID, userID).then(data => {
                        if (data.status) {
                            callApiHideDiary(userID);
                            return callUpdateHotelServices(order2, userID).then(data => {
                                
                                return getServiceInformation(data.serviceId).then(result => {
                                    let object = result;
                                    return conv.ask(`${object.result.serviceType.name} ${object.result.name}. ${object.result.description}`);

                                });
                            });
                        } else {
                            return conv.ask(`El widget de servicios del hotel se encuentra deshabilitado`);
                        }
                    });
                }
            });
        case showDiary:
            return callApiUser().then(response => {                
                var order = params.number;
                var order2 = order - 1;                
                if (response.status === false) {
                    return conv.ask('Para usar este comando debe iniciar sesión en el aplicativo móvil.')
                } else {
                    return GetStateWidget(DiaryWidgetID, userID).then(data => {
                        if (data.status) {
                            callApiHideHotelServices(userID);
                            return callUpdateDiaries(order2, userID).then(data => {
                                if (userID === '') {
                                    return conv.ask(`Ingrese el número de habitación primero`);
                                } else {
                                    return conv.ask(`Mostrando agenda ${order}`);
                                }

                            });
                        } else {
                            return conv.ask(`El widget de agenda se encuentra deshabilitado`);
                        }
                    });

                }
            });


        case closeDiary:
            return callApiUser().then(response => {                
                if (response.status === false) {
                    return conv.ask('Para usar este comando debe iniciar sesión en el aplicativo móvil.')
                } else {

                    return GetStateWidget(DiaryWidgetID, userID).then(data => {
                        if (data.status) {
                            return callApiHideDiary(userID).then(data => {
                                if (userID === '') {
                                    return conv.ask(`Ingrese el número de habitación primero`);
                                } else {
                                    return conv.ask(`Cerrando agenda`);
                                }
                            });
                        } else {
                            return conv.ask(`El widget de agenda se encuentra deshabilitado`);
                        }

                    });


                }
            });
        case readDiary:
            return callApiUser().then(response => {                

                if (response.status === false) {
                    return conv.ask('Para usar este comando debe iniciar sesión en el aplicativo móvil.')
                } else {

                    return GetStateWidget(DiaryWidgetID, userID).then(data => {
                        if (data.status) {
                            callApiHideHotelServices(userID);
                            return callApiGetReadAgenda(userID).then(data => {
                                var description = data.description;
                                var summary = data.summary;
                                var location = data.location;
                                var dateTime = data.dateTime;
                                var response = undefined;
                                console.log()
                                if (userID === '') {
                                    response = conv.ask(`Ingrese el número de habitación primero`);
                                } else if (location !== null && description === null) {
                                    response = conv.ask(`${dateTime} ${summary} en ${location}`);
                                } else if (location === null && description !== null) {
                                    response = conv.ask(`${dateTime} ${summary}. Como detalle adicional, ${description} `);
                                } else if (location !== null && description !== null) {
                                    response = conv.ask(`${dateTime} ${summary} en ${location}. Como detalle adicional, ${description} `);
                                } else if (location === null && description === null) {
                                    response = conv.ask(`${dateTime} ${summary}`);
                                }
                                return response;
                            })
                        } else {
                            return conv.ask(`El widget de agenda se encuentra deshabilitado`);
                        }
                    });
                }

            });
        case readEmail:
            return callApiUser().then(response => {
                if (response.status === false) {
                    return conv.ask('Para usar este comando debe iniciar sesión en el aplicativo móvil.')
                } else {
                    return GetStateWidget(EmailWidgetID, userID).then(data => {
                        if (data.status) {

                            callApiHideDiary(userID);
                            callApiHideHotelServices(userID);
                            return callApiGetEmailInformation(userID).then(data => {
                                var subject = data.subject;
                                var message = data.message;
                                var send = `Asunto: ${subject}. Mensaje: ${message}`;                                
                                callApiSetStartEmail(userID, send);
                                return conv.ask(send)

                            })
                        } else {
                            return conv.ask(`El widget de correo se encuentra deshabilitado`);
                        }
                    });

                }
            });

        case readNews:
            return callApiUser().then(response => {
                if (response.status === false) {
                    callApiHideHotelServicesNoUser(mirrorID);

                    return callApiGetNewsNoUserInformation(mirrorID).then(data => {
                        
                        var description = data.description;
                        var title = data.tittle;
                        var send = `Título: ${title}. ${description}`;                                                

                        callApiSetStartNewsNoUser(mirrorID, send);
                        return conv.ask(send)

                    })
                } else {
                    return GetStateWidget(NewsWidgetID, userID).then(data => {
                        if (data.status) {
                            callApiHideDiary(userID);
                            callApiHideHotelServices(userID);
                            return callApiGetNewsInformation(userID).then(data => {
                                var description = data.description;
                                var title = data.tittle;
                                var send = `Título: ${title}. ${description}`;                                
                                callApiSetStartNews(userID, send);
                                return conv.ask(send)

                            })

                        } else {
                            return conv.ask(`El widget de noticias se encuentra deshabilitado`);
                        }
                    });

                }


            });
        case startEmail:
            return callApiUser().then(response => {
                return GetStateWidget(EmailWidgetID, userID).then(data => {
                    if (data.status) {
                        return callApiSetStartEmail(userID).then(data => {
                            return conv.ask(`Se inicializó el correo`);
                        })
                    } else {
                        return conv.ask(`El widget de correo se encuentra deshabilitado`);
                    }
                });
            });
        default:
            return conv.ask(`No entendí lo que me dijo, repita porfavor`);


    }

});

function callUpdateHotelServices(order, userID) {
    let data = JSON.stringify({ 'order': order, 'userId': userID });
    console.log(data);
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/UpdateServicesHotels',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(JSON.parse(body));
        });
    });
}

function callUpdateHotelServicesNoUser(order, userID) {
    let data = JSON.stringify({ 'order': order, 'mirrorId': userID });
    console.log(data);
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/UpdateServicesHotelsNoUser',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(JSON.parse(body));
        });
    });
}


function callUpdateDiaries(order, userID) {
    let data = JSON.stringify({ 'order': order, 'userId': userID });
    
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/UpdateDiaries',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(body);
        });
    });
}

function callApiHideDiary(userID) {
    let data = JSON.stringify({ userId: userID });
    
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/SetAllDiary',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(body);
        });
    });
}

function callApiHideHotelServices(userID) {
    let data = JSON.stringify({ userId: userID });

    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/SetAllHotelServices',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(body);
        });
    });
}

function callApiHideHotelServicesNoUser(espejito) {
    let data = JSON.stringify({ 'mirrorId': espejito });

    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/SetAllHotelServicesNoUser',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(body);
        });
    });
}

function callApiGetReadAgenda(userID) {
    let data = JSON.stringify({ userId: userID });
    
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/GetDiaryInformations',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(JSON.parse(body));
        });
    });
}

function callApiGetEmailInformation(userID) {
    let data = JSON.stringify({ userId: userID });
    
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/GetEmailInformations',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(JSON.parse(body));
        });
    });
}

function callApiGetNewsInformation(userID) {
    let data = JSON.stringify({ userId: userID });
    
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/GetNewsInformations',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(JSON.parse(body));
        });
    });
}

function callApiGetNewsNoUserInformation(mirroId) {
    let data = JSON.stringify({ mirrorId: mirroId });
    
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/GetNewsNoUserInformations',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: data
        };

        request(options, function (error, requestInternal, body) {
            resolve(JSON.parse(body));
        });
    });
}




function callApiSetStartEmail(userID, description) {
    let data = JSON.stringify({ userId: userID, description: description });
    const options = {
        url: 'http://edumoreno27-001-site2.etempurl.com/SetStartEmail',
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: data
    };
    request(options, function (error, requestInternal, body) {
        resolve(body);
    });
}

function callApiSetStartNews(userID, description) {
    let data = JSON.stringify({ userId: userID, description: description });
    const options = {
        url: 'http://edumoreno27-001-site2.etempurl.com/SetStartNews',
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: data
    };

    request(options, function (error, requestInternal, body) {
        resolve(body);
    });

}

function callApiSetStartNewsNoUser(mirrorID, description) {
    let data = JSON.stringify({ mirrorId: mirrorID, description: description });
    const options = {
        url: 'http://edumoreno27-001-site2.etempurl.com/SetStartNewsNoUser',
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: data
    };

    request(options, function (error, requestInternal, body) {
        resolve(body);
    });

}

function getServicesHotel() {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'https://tp-ires-api.azurewebsites.net/v1/services',
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }

        };

        request(options, function (error, requestInternal, body) {
            let response = JSON.parse(body);
            resolve(response);
        });
    });
}

function getHotelRoomByMirrorID(MirrorID) {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'https://tp-ires-api.azurewebsites.net/v1/management/mirror/' + MirrorID,
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }

        };
        request(options, function (error, requestInternal, body) {
            let response = JSON.parse(body);
            resolve(response);
        });
    });
}

function getServiceInformation(ServideID) {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'https://tp-ires-api.azurewebsites.net/v1/services/' + ServideID,
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }

        };
       request(options, function (error, requestInternal, body) {
            let response = JSON.parse(body);
            resolve(response);
        });
    });
}

function getMirrorIDReservation(roomNumber) {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'https://tp-ires-api.azurewebsites.net/v1/management/habitacion/' + roomNumber,
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }

        };

        request(options, function (error, requestInternal, body) {

            let response = JSON.parse(body);
            resolve(response);
        });
    });
}

function getServiceIDByOrder(userID, orderID) {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/GetServiceId',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID: userID, order: orderID })
        };

        request(options, function (error, requestInternal, body) {
            let data = JSON.parse(body);
            resolve(data);            
        });
    });
}

function BookService(stayid, serviceid, date, dishid) {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'https://tp-ires-api.azurewebsites.net/v1/reservas',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estanciaId: stayid,
                servicioId: serviceid,
                fechaReserva: date,
                platoId: dishid
            })
        };

        request(options, function (error, requestInternal, body) {
            let data = JSON.parse(body);
            resolve(data);            
        });
    });
}

function UpdateActionMusic(action, mirrorId, userID) {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/UpdateMusicAction',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: action,
                mirrorId: mirrorId,
                userId: userID

            })
        };

        request(options, function (error, requestInternal, body) {
            resolve(body);            
        });
    });
}

function UpdateActionMusicNoUser(action, mirrorId) {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/UpdateMusicActionWithoutUser',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: action,
                mirrorId: mirrorId

            })
        };

        request(options, function (error, requestInternal, body) {

            resolve(body);            
        });
    });
}
function GetStateWidget(widgetID, userId) {
    return new Promise((resolve, reject) => {
        const options = {
            url: 'http://edumoreno27-001-site2.etempurl.com/GetStateWidget',
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gadgetID: widgetID,
                userID: userId

            })
        };

        request(options, function (error, requestInternal, body) {
            let data = JSON.parse(body);
            resolve(data);            
        });
    });
}


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);