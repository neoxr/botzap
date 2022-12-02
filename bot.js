const makeWaSocket = require('@adiwajshing/baileys').default
const { makeWALegacySocket, delay, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const { existsSync, mkdirSync, readFileSync } = require('fs')
const P = require('pino')
const fs = require("fs")
const http = require("http")
const qrcode = require("qrcode")
const express = require("express")
const socketIO = require("socket.io")
const port = 8000
const app = express()
const server = http.createServer(app)
const io = socketIO(server)
const BsPath = './sessions/'
const BsAuth = 'auth_info.json'
const retries = new Map()

app.use("/assets", express.static(__dirname + "/assets"))
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

app.get('/', (req, res) => {
    res.sendFile('index.html', {
      root: __dirname
    });
  });


const btmenu = [
   { buttonId: 'compra', buttonText: { displayText: '⭐ COMPRAR UM IMÓVEL ⭐' }, type: 1 },
   { buttonId: 'vender', buttonText: { displayText: '⭐ VENDER UM IMÓVEL ⭐' }, type: 1 },
   { buttonId: 'alugar', buttonText: { displayText: '⭐ ALUGAR UM IMÓVEL ⭐' }, type: 1 },
]

const BsGroupCheck = (jid) => {
   const regexp = new RegExp(/^\d{18}@g.us$/)
   return regexp.test(jid)
}

io.on("connection", async socket => {
   socket.emit('message', '© BOT-Bs - Aguarde a conexão...');
   socket.emit("check", "./assets/off.svg")

   const shouldReconnect = (sessionId) => {
      let maxRetries = parseInt(2 ?? 0)
      let attempts = retries.get(sessionId) ?? 0
      maxRetries = maxRetries < 1 ? 1 : maxRetries
      if (attempts < maxRetries) {
          ++attempts
          console.log('Reconectando...', { attempts, sessionId })
          retries.set(sessionId, attempts)
          return true
      }
      return false
  }

   const BsUpdate = async (BSsock) => {
   BSsock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        const BsReconnect = lastDisconnect?.error?.output?.statusCode
         if (qr){
            //console.log('© BOT-Bs - Qrcode: ', qr);
            qrcode.toDataURL(qr, (err, url) => {
               socket.emit("qr", url)
               socket.emit("message", "© BOT-Bs - Qrcode recebido.")
            })
            
         };
         if (connection === 'close') {
            if (BsReconnect === DisconnectReason.loggedOut || !shouldReconnect(BsPath + BsAuth)) {
               return;
            }
           setTimeout(
               () => {
                  BsConnection()
                  console.log('© BOT-Bs - CONECTADO')
                  socket.emit('message', '© BOT-Bs - WhatsApp conectado!');
                  socket.emit("check", "./assets/check.svg")
               },
               BsReconnect === DisconnectReason.restartRequired ? 0 : parseInt(5000 ?? 0)
            )

            if (BsReconnect === DisconnectReason.connectionClosed) {
               socket.emit('message', '© BOT-Bs - WhatsApp desconectado!');
               socket.emit("check", "./assets/off.svg")
            }
         }
         if (connection === 'open'){
            console.log('© BOT-Bs - CONECTADO')
            socket.emit('message', '© BOT-Bs - WhatsApp conectado!');
            socket.emit("check", "./assets/check.svg")
         }
      })
   }

   const BsConnection = async () => {
      const { version } = await fetchLatestBaileysVersion()

      if (!existsSync(BsPath)) {
         mkdirSync(BsPath, { recursive: true });
      }

      const { saveCreds, state } = await useMultiFileAuthState(BsPath + BsAuth)
      
      const config = {
         auth: state,
         logger: P({ level: 'error' }),
         printQRInTerminal: true,
         version,
         connectTimeoutMs: 60_000,
         async getMessage(key) {
            return { conversation: 'botbs' };
         },
      }

      const BSsock = makeWaSocket(config);
      BsUpdate(BSsock.ev);
      BSsock.ev.on('creds.update', saveCreds);
      //============================================================================================
      const BsSendMessage = async (jid, msg) => {
         await BSsock.presenceSubscribe(jid)
         await delay(1000)
         await BSsock.sendPresenceUpdate('composing', jid)
         await delay(800)
         await BSsock.sendPresenceUpdate('paused', jid)
         return await BSsock.sendMessage(jid, msg)
      }
      //============================================================================================
      BSsock.ev.on('messages.upsert', async ({ messages }) => {
      try {   
        const msg = messages[0]
        const BsUsuario = msg.pushName;
        const jid = msg.key.remoteJid
        const conversa = msg.message.conversation.toLowerCase()
   
        if (!msg.key.fromMe && jid !== 'status@broadcast' && !BsGroupCheck(jid)) {
          console.log("© BOT-Bs - MENSAGEM : ", msg)
   
            // mensagem de texto
            if (conversa === 'oi' && 'Oi') {
               const buttonsMessage = {
                  text: 'Olá ' + BsUsuario + ' tudo bem \n\nEu sou *Paulo* sou corretor de imóveis\nPortador da 🪪 *CRECI - xxxx.xx*\nComo podemos te ajudar 👇🏼',
                  footer: '© BOT-Bs',
                  buttons: btmenu,
                  headerType: 1
               }
               BsSendMessage(jid, buttonsMessage)
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
   
           
   
         
            
      
         }
      }catch (error){
         //continuar rodando
         console.log(error);
       }
      })

      socket.on('delete-session', async function() {
         await BSsock.logout()
            .then(fs.rmSync(BsPath + BsAuth, { recursive: true, force: true }))
            .catch(function() {
              console.log('© BOT-Bs - Sessão removida');
         });
       });
   
   }

   BsConnection()

})

server.listen(port, function() {
   console.log('© BOT-Bs - Servidor rodando na porta: ' + port);
 });