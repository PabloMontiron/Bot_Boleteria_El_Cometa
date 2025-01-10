// BOT BOLETERÍA # 2 - EL COMETA V1.0 __ 06/01/25

const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// Estados y bloqueos
const tiempoBloqueo = new Map();
const BLOQUEO_TIEMPO = 15 * 60 * 1000; 
const estadoUsuario = new Map();
const tramosUsuario = new Map();

const registroUsuario = new Map();

const empresas = {
    1: 'El Cometa / El Cometa Bis',
    2: 'PlataBus / El Aguila',
    3: 'Singer',
    4: 'Central Argentino',
    5: 'NO DEFINIDA'
}

// Nueva instancia del cliente
const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
    console.log('Escanea el código QR para vincular la cuenta.');
    console.log('---------------------------------------------');
    qrcode.generate(qr, { small: true });
});

// Confirmacion
client.on('ready', () => {
    console.log('✔️ El Bot está listo para recibir mensajes.');
    console.log('----------------------------------------');
})

// Funciones
function saludo() {
    return ('¡Te comunicaste con la *Boletería #2 El Cometa (Terminal de Omnibus La Plata 41 y 4)*! 😃');
}

function mostrarMenuPrincipal() {
    return ('Ingrese una de las siguientes opciones (*1 a 4*). \n' +
           '*1* : Comprar pasajes por Whatsapp (*Pago unicamente por transferencia*) \n' +                                                          
           '*2* : Horarios de salida de empresas *(desde La Plata)* \n' +
           '*3* : Horarios de atención al público *(Boletería #2)* \n' +
           '*4* : Consultas (*precios de boletos, disponibilidad de butacas, etc...*)');
}

function mostrarEmpresas() {
    return (
            '*1* : El Cometa / El Cometa Bis \n' +
            '*2* : PlataBus / El Aguila \n' +
            '*3* : Singer \n' +
            '*4* : Central Argentino \n' +
            '*5* : Desconozco la empresa'
    );
}

function volverOTerminar() {
    return (
            '*8* : Volver al menú de inicio \n' +
            '*9* : FINALIZAR CHAT');
}

// Opcion 1 - compras por whastapp
function mostrarOpcion1() { 
    return ('Selecciona una empresa (*1 a 5*), vuelve al menú anterior (*8*) o FINALIZA EL CHAT (*9*): \n' + 
            mostrarEmpresas() + '\n' +
            '---- ---- ---- ---- ---- ---- \n' +
            volverOTerminar()); 
}

function op1EmpSelec(empresaSeleccionada) { 
    return (`Has seleccionado la empresa : *${empresaSeleccionada}* 🚍\n`);
}

//
function horariosDeAtencioAlPublico() {
    return ('Horario de atención al público:\n' +
            '---- ---- ---- ---- ---- ----\n' +
            '*Lunes a Viernes* de 08 30 a 20 30\n' + 
            '*Sábados* de 08 30 a 19 00\n' +
            '*Domingos* de 09 30 a 18 00\n' +
            '---- ---- ---- ---- ---- ----\n' +
            volverOTerminar()
    );
}
//
function mostrarHorariosDeSalida() {
    return (
            'Salidas todos los días *(La Plata)*: \n' +
            '*Costa Atlántica:* \n' +
            '08 00 - 17 35 - 00 35\n' +
            '---- ---- ---- ---- ---- ----\n' +
            '*Mar del Plata:* \n' +
            '08 00 - 11 00 - 14 30 - 18 30 - 00 30\n' +
            '---- ---- ---- ---- ---- ----\n' +
            '*El Cometa (Corrientes/Resistencia/Formosa):* \n' +
            '16 30 Hs.\n' +
            '---- ---- ---- ---- ---- ----\n' +
            '*Singer (Posadas/Pto. Iguazú):* \n' +
            '14 00 Hs.\n' +
            '---- ---- ---- ---- ---- ----\n' +
            '*Central Argentino (San Luis/Mendoza):* \n' +
            '17 45 Hs.\n' +
            '---- ---- ---- ---- ---- ----\n' +
            volverOTerminar()
        ); 
}
// Resumen
function inicializarRegistro(idUsuario) {
    registroUsuario.set(idUsuario, {
        opcionIngresada: null,
        empresa: null,
        destino: null,
    });
}

function mostrarResumen(idUsuario) {
    const registro = registroUsuario.get(idUsuario);
    
    if (registro) {
        return (
            `📝 Detalles de la consulta : \n` +
            `*Opción ingresada* : ${registro.opcionIngresada} \n` +
            `*Empresa* : ${registro.empresa} \n` +
            `*Destino* : ${registro.destino}`
        );
    }
}

// Respuesta a mensajes
client.on('message', async (mensaje) => {

    const idUsuario = mensaje.from; 
    const tiempoAct = Date.now();
    const resp = mensaje.body.trim();

    // Ignorar grupos whastApp
    if (idUsuario.endsWith('@g.us')) {
        console.log(`Mensaje ignorado del grupo : ${idUsuario}`);
        return;
    }

    // Mensajes con medios (boletos o comprobantes de pago)
    if (mensaje.hasMedia) {
        await mensaje.reply('📸 Envío de foto de boleto / comprobante de pago recibido');
        console.log(`Foto recibida de ${idUsuario}`);
        return;
    }

    // Inicializa registro para el ID act si no existe
    if (!registroUsuario.has(idUsuario)) {
        inicializarRegistro(idUsuario);
    }

    // Verifica bloqueo
    if (tiempoBloqueo.has(idUsuario)) {
        
        const tiempoBloqueoUs = tiempoBloqueo.get(idUsuario);

        if (tiempoAct < tiempoBloqueoUs) {
            const minutosRestantes = Math.ceil((tiempoBloqueoUs - tiempoAct) / 60000);
            console.log(`Usuario ${idUsuario} bloqueado. Ignorando mensajes. Tiempo bloqueo restante: ${minutosRestantes} min.`); 
            return
        } else {
            tiempoBloqueo.delete(idUsuario);
            console.log(`Usuario ${idUsuario} desbloqueado.`);
        }
    }

    // Estado Inicial
    if (!estadoUsuario.has(idUsuario)) {
        estadoUsuario.set(idUsuario,'inicio');
        await mensaje.reply(saludo());
        await mensaje.reply(mostrarMenuPrincipal());
        return;
    }

    // EstadoUsuario (map) clave : id , valor : estado
    const estadoAct = estadoUsuario.get(idUsuario);
    
    switch (estadoAct) {
        case 'inicio': {
            if ( resp === '1') { 
                estadoUsuario.set(idUsuario,'opcion_seleccionada');
                const registro = registroUsuario.get(idUsuario);
                
                registro.opcionIngresada = 'Compra por WhatsApp';
                
                if (['1','2','3','4'].includes(resp)) {  
                    await mensaje.reply(mostrarOpcion1());
                    estadoUsuario.set(idUsuario,'compra_wthats_empSelec');
                }
               
            } else if ( resp === '2') {
                await mensaje.reply(mostrarHorariosDeSalida());
                estadoUsuario.set(idUsuario,'volver_terminar');

            } else if ( resp === '3') {
                await mensaje.reply(horariosDeAtencioAlPublico());
                estadoUsuario.set(idUsuario,'volver_terminar'); 

            } else if (resp === '4') {
                await mensaje.reply('Escriba la consulta que desea realizar *(SOLO TEXTO)*');
                estadoUsuario.set(idUsuario,'finaliza_chat');

            } else {
                await mensaje.reply('⚠️ La opción ingresada no es válida. Solo debe ingresar números\n');
                await mensaje.reply(mostrarMenuPrincipal());  
            }
        break; 

        }
            case 'compra_wthats_empSelec': {

                    const cod = parseInt(resp.trim(),10);

                    if (!isNaN(cod) && empresas[cod]) {
                        const registro = registroUsuario.get(idUsuario);
                        const empSeleccionada = empresas[cod];

                        await mensaje.reply(op1EmpSelec(empSeleccionada));

                        registro.empresa = empSeleccionada;

                        estadoUsuario.set(idUsuario,'ingresando_destino');
                        await mensaje.reply('*Escriba la ciudad de Destino:* ');

                    } else if ( resp === '8' ) {
                        estadoUsuario.set(idUsuario,'inicio');
                        await mensaje.reply(mostrarMenuPrincipal());

                    } else if ( resp === '9' ) {
                        tiempoBloqueo.set(idUsuario, Date.now() + BLOQUEO_TIEMPO);
                        estadoUsuario.delete(idUsuario);
                        registroUsuario.delete(idUsuario);
                        await mensaje.reply('¡Gracias por viajar con nosotros! Espere a ser atendido por un representante 😃');

                    } else {
                        await mensaje.reply('⚠️ Opción no valida. Ingresa una opción correcta (solo NÚMEROS).');
                        await mensaje.reply(mostrarOpcion1());
                    }      
            break;
            } 
            
            case 'ingresando_destino': { 

                const destinoAct = mensaje.body.trim();

                if (destinoAct) {
                    const registro = registroUsuario.get(idUsuario);

                    registro.destino = destinoAct;
              
                    await mensaje.reply(`Has ingresado : \n` +          
                        `*Empresa:* ${registro.empresa} \n` +
                        `*Destino:* ${registro.destino} \n` +
                        `Si es correcto, ingrese (*1*) para continuar sino (*2*) para modificar destino o (*3*) volver al menú de empresas.` );
                
                    estadoUsuario.set(idUsuario,'confirmar_tramos');
            
                } else {
                    await mensaje.reply('⚠️ Por favor, escribe un mensaje válido (solo NÚMEROS).')
                }
            console.log(tramosUsuario.get(idUsuario));
            break;
            }

            case 'confirmar_tramos': {

                const confirmacion = mensaje.body.trim();

                if (confirmacion === '1') {
                
                    await mensaje.reply('¡Gracias por viajar con nosotros! Espere a ser atendido por un representante 😃');
                    await mensaje.reply(mostrarResumen(idUsuario));
               
                    tiempoBloqueo.set(idUsuario, Date.now() + BLOQUEO_TIEMPO);
                    tramosUsuario.delete(idUsuario);
                    estadoUsuario.delete(idUsuario); 

                } else if (confirmacion === '2') {
                    estadoUsuario.set(idUsuario,'ingresando_destino');
                    await mensaje.reply('Escriba la ciudad de destino: ');

                } else if (confirmacion === '3') {
                    estadoUsuario.set(idUsuario,'compra_wthats_empSelec');
                    await mensaje.reply(mostrarOpcion1());

                } else {
                    await mensaje.reply('⚠️ Igrese una opción válida. (*1 , 2 o 3*)');
                }
            break;
            } 
            
            case 'finaliza_chat': {
                await mensaje.reply('✔️ Su consulta ah sido registrada, por favor espere hasta que un representante se comunique. Intente no escribir hasta ese momento.');
                tiempoBloqueo.set(idUsuario, Date.now() + BLOQUEO_TIEMPO);
                estadoUsuario.delete(idUsuario);

                tramosUsuario.delete(idUsuario);
                registroUsuario.delete(idUsuario);

            break;
            }

            case 'volver_terminar': {
                if (resp === '8') {
                    estadoUsuario.set(idUsuario,'inicio');
                    await mensaje.reply(mostrarMenuPrincipal());
                    
                } else if (resp === '9') {
                    await mensaje.reply('Muchas gracias por comunicarse con nosotros!😃');
                    tiempoBloqueo.set(idUsuario, Date.now() + BLOQUEO_TIEMPO);
                    estadoUsuario.delete(idUsuario);

                    tramosUsuario.delete(idUsuario);
                    registroUsuario.delete(idUsuario);
                }
            }
    }
});

client.initialize();
