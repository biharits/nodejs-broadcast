const fs = require('fs')
const credentials = {
  key: fs.readFileSync('letsencrypt/live/example.domain.com/privkey.pem', 'utf-8'),
  cert: fs.readFileSync('letsencrypt/live/example.domain.com/cert.pem', 'utf-8'),
  ca: fs.readFileSync('letsencrypt/live/example.domain.com/chain.pem', 'utf-8')
}
const { ExpressPeerServer } = require('peer')
const express = require('express')
const app = express()
const https = require('https').Server(credentials, app)
const io = require('socket.io')(https)
const { v4: uuidV4 } = require('uuid')
const peerServer = ExpressPeerServer(https, {
  debug: true,
  ssl: credentials
});

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (__req, res) => {
  res.redirect(`https://example.domain.com:port/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.broadcast.to(roomId).emit('user-connected', userId);
    console.info('User connected: ' + userId + ' to room: ' + roomId)

    socket.on('disconnect', () => {
      socket.broadcast.to(roomId).emit('user-disconnected', userId);
      console.info('User disconnected: ' + userId + ' from room: ' + roomId)
    })
  })
})

https.listen(3000)