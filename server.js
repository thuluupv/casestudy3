const http = require('http');
const fs = require('fs');
const {Server} = require('socket.io');

const mimeTypes = {
    "html": "text/html",
    "js": "text/javascript",
    "css": "text/css"
};

const httpServer = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream('./templates/index.html').pipe(res)
    }
    /* đọc file css/js*/
    const filesDefences = req.url.match(/\.js|.css/);
    if (filesDefences) {
        const extension = mimeTypes[filesDefences[0].toString().split('.')[1]];
        res.writeHead(200, { 'Content-Type': extension });
        fs.createReadStream(__dirname + "/" + req.url).pipe(res)
    }
})
const io = new Server(httpServer);

var usernames = {};

var rooms = ['Lobby'];

io.sockets.on('connection', function (socket) {

    socket.on('adduser', function (username, nameRoom){
        socket.username = username;
        socket.room = nameRoom;
        usernames[username] = username;
        console.log(usernames)
        socket.join(nameRoom);
        if (nameRoom != null && rooms.indexOf(nameRoom) <0){
            rooms.push(nameRoom)
        }
        socket.emit('updatechat', 'SERVER', 'you have connected to '+ nameRoom);
        socket.broadcast.to(nameRoom).emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, nameRoom);
    });

    socket.on('create', function (room) {
        var room = 'test';
        rooms.push(room);
    });

    socket.on('sendchat', function (data) {
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('switchRoom', function(newroom){
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });


    socket.on('disconnect', function(){

        delete usernames[socket.username];
        io.sockets.emit('updateusers', usernames);
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
        console.log(socket.room);
        console.log(123);
    });
});
httpServer.listen(3000,()=>{
    console.log('Listening on port 3000');
})
