const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
      origin: '*',
    }
  });



app.get('/success/:id', (req, res,next) => {
  console.log(req.params);
  io.sockets.emit("pay-success", req.params);
  res.send("ok");
  next();
});


io.on('connection', (socket) => {
  console.log('a user connected');
  var room_id;

  socket.on('join-room',(data) => {
     socket.join(data);
     console.log(data)
     room_id = data;
    });
    socket.on('join-room-listen',(data) => {
      socket.join(data);
      io.sockets.in(data).emit("hello",data);
      console.log(data)
      
     });

    

     socket.on('pay-req',(data)=>{
    /*    client.createTransaction(data).then((result) =>{
            socket.emit("pay-resp",result);
        })*/
     })


     socket.on('check-room',(data) => {
      console.log(data);
      //console.log(getActiveRooms(io).indexOf(data));
      if(getActiveRooms(io).indexOf(data)!=-1){

          socket.emit('room-resp',"OK_ROOM_FOUND");
      }else{
        socket.emit('room-resp',"ERROR_ROOM_NOT_FOUND");
      }
     });


  var sid;
  socket.on("start_send",(data)=>{
     sid = data.uid;
     console.log(sid)
     io.sockets.in(room_id).emit("on_started",data);
    socket.on("chunk",(data)=>{
       
        io.sockets.in(room_id).emit("on_chunk",data);
    })
    socket.on(sid,(data)=>{
      console.log(sid);
      io.sockets.in(room_id).emit("check_res","OK_"+data);
    });
  });
  socket.on('message', (data) => {
   
      console.log(sid);
     
  });

  socket.on("check", (data) => {
      socket.emit("check_res","OK_"+data);
  });
});
function getActiveRooms(io) {
  // Convert map into 2D list:
  // ==> [['4ziBKG9XFS06NdtVAAAH', Set(1)], ['room1', Set(2)], ...]
  const arr = Array.from(io.sockets.adapter.rooms);
  // Filter rooms whose name exist in set:
  // ==> [['room1', Set(2)], ['room2', Set(2)]]
  const filtered = arr.filter(room => !room[1].has(room[0]))
  // Return only the room name: 
  // ==> ['room1', 'room2']
  const res = filtered.map(i => i[0]);
  return res;
}
server.listen(3000, () => {
  console.log('listening on *:3000');
});