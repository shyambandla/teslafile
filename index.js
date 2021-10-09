const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('fs')
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
      origin: '*',
    }
  });

 


  function jsonReader(filePath, cb) {
    fs.readFile(filePath, (err, fileData) => {
      if (err) {
        return cb && cb(err);
      }
      try {
        const object = JSON.parse(fileData);
        return cb && cb(null, object);
      } catch (err) {
        return cb && cb(err);
      }
    });
  }

app.get('/api/success/:id', (req, res,next) => {
//  console.log(req.params);
  io.sockets.emit(req.params.id, req.params);
  res.redirect('/');
  next();
});


io.on('connection', (socket) => {
  //console.log('a user connected');
  var room_id;
  jsonReader("data.json", (err,data) => {
    if (err) {
      console.log(err);
      return;
    }
   
    io.sockets.emit("transferred-data",data.total);
     // => "Infinity Loop Drive"
  });
socket.on('confirm', (data) => {
  console.log(data);
  socket.emit(data,"done");
})


  
  socket.on('join-room',(data) => {
     socket.join(data);
     io.sockets.in(room_id).emit("hello",data);
    // console.log(data)
     room_id = data;
    });
    socket.on('join-room-listen',(data) => {
      socket.join(data);
      io.sockets.in(data).emit("hello",data);
     // console.log(data)
    
     socket.on("checking",data=>{
      io.sockets.in(data).emit("confirmDone","confirmed");
    });
    /////
   socket.on('notifyProgress',(data)=>{

    io.sockets.in(data.uid).emit("onNotifyProgress",data);

   });



    /////
    socket.on("size-update",data=>{
      jsonReader('data.json',(err,res)=>{
      const customer = {
        total:res.total+data
      }
      const jsonString = JSON.stringify(customer);
      fs.writeFile('data.json', jsonString, err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
            socket.broadcast.emit("transferred-data",customer.total);
        }
    })
  });



    })
    socket.on("notifyRecieved",(data)=>{
      io.sockets.in(data.uid).emit("onNotifyRecieved",data);
    });
     });

     socket.on('done',(data) => {
      console.log("room id ",data)
      io.sockets.in(room_id).emit("on_done",data);
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
   
    io.sockets.in(room_id).emit("message","OK");
     
  });

  socket.on("check", (data) => {
      socket.emit("check_res","OK_"+data);
  });
  socket.on('file',(data) => {
    console.log("recieved");
   io.sockets.in(room_id).emit("file-recieved-done",data);
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
