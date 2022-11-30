const makeWaSocket = require('@adiwajshing/baileys').default
const { delay, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const { unlink, existsSync, mkdirSync, readFileSync } = require('fs')
const P = require('pino')
const ZDGPath = './ZDGSessions/'
const ZDGAuth = 'auth_info.json'

const ZDGLocation = {
   location: { 
      degreesLatitude: 24.121231, 
      degreesLongitude: 55.1121221 
   } 
}
const ZDGurlBtn1 = {
   url: 'http://zapdasgalaxias.com.br/',
   displayText: '🚀 ZAP das Galáxias © BOT-ZDG 🚀',
}
const ZDGurlBtn2 = {
   url: 'http://zapdasgalaxias.com.br/',
   displayText: '👨‍🚀 Pedrinho da NASA © BOT-ZDG 👨‍🚀',
}
const ZDGreplyBtn1 = {
   id: 'zdg1',
   displayText: 'Resposta 1',
}
const ZDGreplyBtn2 = {
   id: 'zdg2',
   displayText: 'Resposta 2',
}
const callButton = {
   displayText: 'Ligar agora ☎️',
   phoneNumber: '+55 35 9 8875-4197',
}
const ZDGbtnMD = [
   { index: 0, urlButton: ZDGurlBtn1 },
   { index: 1, urlButton: ZDGurlBtn2 },
   { index: 2, callButton },
   { index: 3, quickReplyButton: ZDGreplyBtn1 },
   { index: 4, quickReplyButton: ZDGreplyBtn2 },
]
const buttons = [
   { buttonId: 'zdg1', buttonText: { displayText: '⭐ Comunidad ZDG ⭐' }, type: 1 },
   { buttonId: 'zdg2', buttonText: { displayText: '▶️ YouTube ▶️' }, type: 1 },
   { buttonId: 'zdg3', buttonText: { displayText: '👨‍🚀 Pedrinho da NASA 👨‍🚀' }, type: 1 },
]

const ZDGGroupCheck = (jid) => {
   const regexp = new RegExp(/^\d{18}@g.us$/)
   return regexp.test(jid)
}

const ZDGUpdate = (ZDGsock) => {
   ZDGsock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr){
         console.log('© BOT-ZDG - Qrcode: ', qr);
      };
      if (connection === 'close') {
         const ZDGReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
         if (ZDGReconnect) ZDGConnection()
         console.log(`© BOT-ZDG - CONEXÃO FECHADA! RAZÃO: ` + DisconnectReason.loggedOut.toString());
         if (ZDGReconnect === false) {
            const removeAuth = ZDGPath + ZDGAuth
            unlink(removeAuth, err => {
               if (err) throw err
            })
         }
      }
      if (connection === 'open'){
         console.log('© BOT-ZDG - CONECTADO')
      }
   })
}

const ZDGConnection = async () => {
   const { version } = await fetchLatestBaileysVersion()
   if (!existsSync(ZDGPath)) {
      mkdirSync(ZDGPath, { recursive: true });
   }
   const { saveState, state } = useSingleFileAuthState(ZDGPath + ZDGAuth)
   const config = {
      auth: state,
      logger: P({ level: 'error' }),
      printQRInTerminal: true,
      version,
      connectTimeoutMs: 60_000,
      async getMessage(key) {
         return { conversation: 'botzg' };
      },
   }
   const ZDGsock = makeWaSocket(config);
   ZDGUpdate(ZDGsock.ev);
   ZDGsock.ev.on('creds.update', saveState);

   const ZDGSendMessage = async (jid, msg) => {
      await ZDGsock.presenceSubscribe(jid)
      await delay(2000)
      await ZDGsock.sendPresenceUpdate('composing', jid)
      await delay(1500)
      await ZDGsock.sendPresenceUpdate('paused', jid)
      return await ZDGsock.sendMessage(jid, msg)
   }

   ZDGsock.ev.on('messages.upsert', async ({ messages, type }) => {
   const msg = messages[0]
   const ZDGUsuario = msg.pushName;
   const jid = msg.key.remoteJid

      if (!msg.key.fromMe && jid !== 'status@broadcast' && !ZDGGroupCheck(jid)) {
         console.log("© BOT-ZDG - MENSAGEM : ", msg)

         ZDGsock.sendReadReceipt(jid, msg.key.participant, [msg.key.id])

         // mensagem de texto
         if (msg.message.conversation.toLowerCase() === 'botzdg') {
            ZDGSendMessage(jid, { text: ZDGUsuario + ' entre agora para comunidade ZDG e tenha acesso a esse projeto completo e mais de 100 vídeo aulas sobre APIs de WhatsApp.' })
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // localização
         if (msg.message.conversation.toLowerCase() === 'localzdg') {
            ZDGSendMessage(jid, ZDGLocation)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // link
         if (msg.message.conversation.toLowerCase() === 'linkzdg') {
            ZDGSendMessage(jid, {
               forward: {
                  key: { fromMe: true },
                  message: {
                     extendedTextMessage: {
                        text: 'https://zapdasgalaxias.com.br/',
                        matchedText: 'https://zapdasgalaxias.com.br/',
                        canonicalUrl: 'https://zapdasgalaxias.com.br/',
                        title: 'Comunidade ZDG - ZAP das Galáxias',
                        description: '© Pedrinho da NASA',
                        // opicional
                        jpegThumbnail: readFileSync('./assets/icone.png')
                     }
                  }
               }
            })
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // lista
         if (msg.message.conversation.toLowerCase() === 'listazdg') {
            const sections = [
               {
                  title: 'ZDG #1',
                  rows: [
                     { title: 'Coluna #1', description: 'Descrição #1', rowId: 'zdg1' },
                     { title: 'Coluna #2', description: 'Descrição #2', rowId: 'zdg2' },
                     { title: 'Coluna #3', description: 'Descrição #3', rowId: 'zdg3' },
                  ],
               },
               {
                  title: 'ZDG #2',
                  rows: [
                     { title: 'Coluna #1', description: 'Descrição #1', rowId: 'zdg3' },
                     { title: 'Coluna #2', description: 'Descrição #2', rowId: 'zdg5' },
                     { title: 'Coluna #3', description: 'Descrição #3', rowId: 'zdg6' },
                     { title: 'Coluna #4', description: 'Descrição #4', rowId: 'zdg7' },
                  ],
               },
               {
                  title: 'ZDG #3',
                  rows: [
                     { title: 'Coluna 01', description: 'Descrição #1', rowId: 'zdg8' },
                     { title: 'Coluna 02', description: 'Descrição #2', rowId: 'zdg9' },
                  ],
               },
            ]

            const sendList = {
               title: '🚀 *ZDG Título* 🚀\n',
               text: 'Clique no botão\n',
               buttonText: 'Clique aqui',
               footer: '©BOT-ZDG\nComunidade ZDG: https://zapdasgalaxias.com.br/',
               sections: sections
            }

            ZDGSendMessage(jid, sendList)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // botões
         if (msg.message.conversation.toLowerCase() === 'botaozdg') {
            const buttonsMessage = {
               text: '*ZDG Título do Botão*\n\nZDG Descrição do Botão',
               footer: '© BOT-ZDG',
               buttons: buttons,
               headerType: 1
            }
            ZDGSendMessage(jid, buttonsMessage)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // botões md
         if (msg.message.conversation.toLowerCase() === 'botaomdzdg') {
            const ZDGLayout = {
               text: '*ZDG Título do Botão*\n\nZDG Descrição do Botão',
               footer: '© BOT-ZDG',
               templateButtons: ZDGbtnMD
            }
            ZDGSendMessage(jid, ZDGLayout)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // imagem
         if (msg.message.conversation.toLowerCase() === 'imagemzdg') {
            const ZDGImagem = {
               // opicional
               caption: '```ZAP DAS GALÁXIAS```',
               image: {
                  url: './assets/icone.png',
                  //url: 'https://zapdasgalaxias.com.br/wp-content/uploads/elementor/thumbs/icone-2-pdi31v9k8vtxs105ykbgfpwsyu37k4387us769we0w.png'
               }
            }
            ZDGSendMessage(jid, ZDGImagem)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // imagem + botões
         if (msg.message.conversation.toLowerCase() === 'imagembotaozdg') {
            const ZDGImagem = {
               // opicional
               caption: '```ZAP DAS GALÁXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: '© BOT-ZDG',
               image: {
                  url: './assets/icone.png',
                  //url: 'https://zapdasgalaxias.com.br/wp-content/uploads/elementor/thumbs/icone-2-pdi31v9k8vtxs105ykbgfpwsyu37k4387us769we0w.png'
               },
               buttons: buttons
            }
            ZDGSendMessage(jid, ZDGImagem)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // imagem + botões MD
         if (msg.message.conversation.toLowerCase() === 'imagembotaomdzdg') {
            const ZDGImagem = {
               // opicional
               caption: '```ZAP DAS GALÁXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: '© BOT-ZDG',
               image: {
                  url: './assets/icone.png',
                  //url: 'https://zapdasgalaxias.com.br/wp-content/uploads/elementor/thumbs/icone-2-pdi31v9k8vtxs105ykbgfpwsyu37k4387us769we0w.png'
               },
               templateButtons: ZDGbtnMD
            }
            ZDGSendMessage(jid, ZDGImagem)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // vídeo
         if (msg.message.conversation.toLowerCase() === 'videozdg') {
            const sendVideo = {
               // opicional
               caption: '```ZAP DAS GALÁXIAS```',
               video: {
                  url: './assets/zdg.mp4',
               },
               mimetype: 'video/mp4',
               gifPlayback: true
            }
            ZDGSendMessage(jid, sendVideo)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // vídeo + botões
         if (msg.message.conversation.toLowerCase() === 'videobotaozdg') {
            const templateVideo = {
               // opicional
               caption: '```ZAP DAS GALÁXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: '© BOT-ZDG',
               video: {
                  url: './assets/zdg.mp4',
               },
               mimetype: 'video/mp4',
               gifPlayback: true,
               buttons: buttons
            }
            ZDGSendMessage(jid, templateVideo)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // vídeo + botões MD
         if (msg.message.conversation.toLowerCase() === 'videobotaomdzdg') {
            const templateVideo = {
               // opicional
               caption: '```ZAP DAS GALÁXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: '© BOT-ZDG',
               video: {
                  url: './assets/zdg.mp4',
               },
               mimetype: 'video/mp4',
               gifPlayback: true,
               templateButtons: ZDGbtnMD
            }
            ZDGSendMessage(jid, templateVideo)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // pdf
         if (msg.message.conversation.toLowerCase() === 'pdfzdg') {
            const sendDoc = {
               fileName: 'zdg.pdf',
               mimetype: 'application/pdf',
               document: {
                  url: './assets/zdg.pdf'
                  // url: 'https://zapdasgalaxias.com.br/exemplo.pdf'
               }
            }
            ZDGSendMessage(jid, sendDoc)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // pdf + botões
         if (msg.message.conversation.toLowerCase() === 'pdfbotaozdg') {
            const templateDoc = {
               // opicional
               caption: '```ZAP DAS GALÁXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: '© BOT-ZDG',
               fileName: 'zdg.pdf',
               mimetype: 'application/pdf',
               document: {
                  url: './assets/zdg.pdf'
                  // url: 'https://zapdasgalaxias.com.br/exemplo.pdf'
               },
               buttons: buttons
            }
            ZDGSendMessage(jid, templateDoc)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // pdf + botões MD
         if (msg.message.conversation.toLowerCase() === 'pdfbotaomdzdg') {
            const templateDoc = {
               // opicional
               caption: '```ZAP DAS GALÁXIAS```\n\nPedrinho da NASA',
               // opicional
               footer: '© BOT-ZDG',
               fileName: 'zdg.pdf',
               mimetype: 'application/pdf',
               document: {
                  url: './assets/zdg.pdf'
                  // url: 'https://zapdasgalaxias.com.br/exemplo.pdf'
               },
               templateButtons: ZDGbtnMD
            }
            ZDGSendMessage(jid, templateDoc)
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // contatos
         if (msg.message.conversation.toLowerCase() === 'contatozdg') {
            const contact = {
               fullName: 'Pedrinho da NASA',
               waid: '5535988754197',
               phoneNumber: '+55 35 9 8875-4197'
            }
            const vcard =
               'BEGIN:VCARD\n' +
               'VERSION:3.0\n' +
               'FN:' +
               contact.fullName +
               '\n' +
               'item1.TEL;waid=' +
               contact.waid +
               ':' +
               contact.phoneNumber +
               '\n' +
               'item1.X-ABLabel:Celular\n' +
               'END:VCARD'

            ZDGSendMessage(jid, {
               contacts: {
                  displayName: contact.fullName,
                  contacts: [{ vcard, displayName: contact.fullName }]
               }
            })
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }

         // lista de contatos
         if (msg.message.conversation.toLowerCase() === 'contatolistazdg') {
            const contactList = [
               {
                  fullName: 'Pedrinho da NASA #1',
                  waid: '5535988754197',
                  phoneNumber: '+55 35 9 8875-4197',
               },
               {
                  fullName: 'Pedrinho da NASA #2',
                  waid: '5535988754197',
                  phoneNumber: '+55 35 9 8875-4197',
               },
               {
                  fullName: 'Pedrinho da NASA #3',
                  waid: '5535988754197',
                  phoneNumber: '+55 35 9 8875-4197',
               },
            ]

            const contacts = Array.from(contactList, c => {
               return {
                  displayName: c.fullName,
                  vcard:
                     'BEGIN:VCARD\n' +
                     'VERSION:3.0\n' +
                     'FN:' +
                     c.fullName +
                     '\n' +
                     'item1.TEL;waid=' +
                     c.waid +
                     ':' +
                     c.phoneNumber +
                     '\n' +
                     'item1.X-ABLabel:Celular\n' +
                     'END:VCARD',
               }
            })

            ZDGSendMessage(jid, {
               contacts: {
                  displayName: `${contacts.length} contatos`,
                  contacts: contacts
               }
            })
               .then(result => console.log('RESULT: ', result))
               .catch(err => console.log('ERROR: ', err))
         }
      }
   })

}

ZDGConnection()