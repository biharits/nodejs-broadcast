const socket = io('/')
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})

const peers = {}

let supports = navigator.mediaDevices.getSupportedConstraints();
console.info(supports)

if (!supports["width"] || !supports["height"] || !supports["frameRate"] || !supports["facingMode"] || !supports["echoCancellation"] || !supports["autoGainControl"] || !supports["noiseSuppression"] || !supports["channelCount"] || !supports["deviceId"] || !supports["groupId"] ) {
  console.info('Phone support mode')
  constraints = {
    audio: true,
    video: {
      width: { ideal: 1920 },
      frameRate: { ideal: 30 },
      aspectRatio: { ideal: 1.777777778 },
      facingMode: { ideal: "environment" },
    }
  }
} else {
  console.info('Full support mode')
  constraints = {
    video: {
      //deviceId:
      //groupId:
      width: { ideal: 1920 },
      frameRate: { ideal: 25 },
      aspectRatio: { ideal: 1.777777778 },
    },
    audio: {
      //deviceId:
      //groupId:
      sampleRate: { ideal: 48000 },
      sampleSize: { ideal: 24 },
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
      channelCount: { ideal: 2 },
    }
  };
}

navigator.mediaDevices.getUserMedia(constraints).then(stream => {
  myVideo = document.createElement('video')
  myVideo.muted = true
  myVideo.srcObject = stream
  myVideo.onloadedmetadata = function(e) {
    myVideo.play()
  };
  //document.getElementById('video-grid').append(myVideo)

  myPeer.on('call', call => {
    const video = document.createElement('video')
    video.muted = true
    call.answer(stream)
    call.on('stream', userVideoStream => {
      video.srcObject = userVideoStream
      video.onloadeddata = function(e) {
        video.play()
      };
      document.getElementById('video-grid').append(video)
    })
  })

  socket.on('user-connected', userId => {
    console.info('User connected: ' + userId)
    setTimeout(() => {
      const video = document.createElement('video')
      video.muted = true
      myPeer.call(userId, stream)
      myPeer.on('stream', userVideoStream => {
        video.srcObject = userVideoStream
        video.onloadeddata = function(e) {
          video.play()
        };
        peers[userId] = userVideoStream
      })
    }, 1000)
    myPeer.on('close', userVideoStream => {
      video.remove(video, userVideoStream)
    })
  })
});

socket.on('user-disconnected', userId => {
  console.info('User disconnected: ' + userId)
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id);
  console.info('MyID: ' + id)
})
