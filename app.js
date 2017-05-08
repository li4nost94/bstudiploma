var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cfenv = require('cfenv');

var sanitizeHtml = require('sanitize-html');

// запуск файлов из ./public
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});


var users = {};
var rooms = {};

//Оъекты пользователя для отправки
function safeUser(user) {
    return {
        id: user.id,
        name: user.name,
        pic: user.pic,
        hash: user.hash
    }
}

function getRoomMembers(roomId, requesterId) {
    return rooms[roomId].map(function (id) {
        return safeUser(users[id]);
    });
}

//Gets oldest user in a room
function getOldestUser(roomId, skipOwner) {
    var roomOwner = users[roomId]; //Получить оригинального пользователя
    if (roomOwner && roomOwner.room === roomId && !skipOwner) { //убедиться что владелец имеет roomId
        return roomOwner;
    } else {
        //Если владелец ушел - берем всех остальных пользователей в комнате
        for (var i = 0; i < rooms[roomId].length; i++) {
            var oldestUser = users[rooms[roomId][i]];
            if (oldestUser && oldestUser.room === roomId) { //Поверить в сети ли они
                return oldestUser;
            }
        }
        //Если это не так, то код доступен
    }
}

function getOnline(requesterId) {
    var keys = Object.keys(users);
    var result = [];
    for (var i = 0; i < keys.length; i++) {
        if (requesterId === users[keys[i]].id) continue; //Не отправлять ответ
        result.push(safeUser(users[keys[i]]));
    }
    return result;
}

io.on('connection', function (socket) {
    var id = socket.id;


    socket.on('error', function (err) {
        console.log(err);
    });

    socket.on('disconnect', function () {
        if (!users[id]) return; //Не делать очистки, так как дисконнект
        io.emit('online/leave', safeUser(users[id]));
        
        var oldRoomId = users[id].room;
        var index = rooms[oldRoomId].indexOf(id); 
        rooms[oldRoomId].splice(index, 1); //Удалить пользователя из комнаты
        
        delete users[id]; //Удалить ссылку
    });

    //Сработка интерфейса когда первый пользователь онлайн
    socket.on('online/join', function (tryMe) {
        if (tryMe.name.length <= 1) return; //Название комнаты

        users[id] = {};
        users[id].name = sanitizeHtml(tryMe.name);
        users[id].pic = sanitizeHtml(tryMe.pic);
        users[id].hash = sanitizeHtml(tryMe.hash); //Хэш пользователя
        users[id].id = id;
        users[id].socket = socket;
        users[id].room = id;
        users[id].rooms = {};
        users[id].rooms[id] = true;
        rooms[id] = [id];


        socket.emit('online/who', getOnline(id)); //кто онлайн
        socket.emit('online/handshake', id); //возвращает их id
        socket.broadcast.emit('online/join', safeUser(users[id])); //Говорит всем кто онлайн +   
    });

    //Срабатывает когда пользователь делает доступ (просит)
    socket.on('room/request', function (roomId) {
        var originalId = roomId;
        if (!users[roomId]) return; //Ответчик оставил
        roomId = users[roomId].room; //перенаправить запрос владельцу
        var roomOwner = getOldestUser(roomId); //Если влдельца нет, по порядку назначается гласным в комнате
        if (!roomOwner) return;
        if (users[id].room === roomOwner.room) return; //Столько пользователей в комнате
        roomOwner.socket.emit('room/request', {user:safeUser(users[id]), originalId:originalId}); //Отправить запрос на владельца номера
    });

    //Когда реагирует на номер доступа
    socket.on('room/response', function (data) {
        var userId = data.userId;
        if (!users[userId]) return; //Запрос ставлен
        users[userId].rooms[id] = true; //Присоединился прользователь к комнате
        users[userId].socket.emit('room/response', {
            user: safeUser(users[id]),
            who: getRoomMembers(id, userId),
            originalId: data.originalId
        }); //Информировать других пользователей
    });

    //When joins room
    socket.on('room/join', function (roomId) {
        if (!users[id].rooms[roomId]) return; //Блокировать несанкционированное соединение

        var oldRoomId = users[id].room;
        socket.broadcast.to(oldRoomId).emit('room/leave', safeUser(users[id])); //Сообщение о выходе текущего пользователя
        var index = rooms[oldRoomId].indexOf(id); 
        rooms[oldRoomId].splice(index, 1); //Удалить человека из комнаты

        users[id].room = roomId; //Выбрать номер
        socket.join(roomId); //Присоединиться к комнате
        rooms[roomId].push(id); //отправить всем уведомление (или 2му человеу если вас 2)
        socket.broadcast.to(roomId).emit('room/join', safeUser(users[id])); //Сообщение о присоединении
        
        //Обслуживание кода проекта
        var roomId = users[id].room;
        var roomOwner = getOldestUser(roomId);
        roomOwner.socket.emit('code/all/get', id);
    });

    //Выгнать из комнаты
    socket.on('room/kick', function (userId) {
        if (users[userId].room != id) return; //Блокировать кикнутого
        users[userId].rooms[id] = false; //Удалить настройки доступа (permissions)
        users[userId].socket.leave(id); //покинуть комнату
        users[userId].socket.emit('room/kick', getOnline(userId)); //Оповещение пользователей их выгнать (отправить список онлайн пользователей, чтобы убедиться, что они в курсе)
        io.in(id).emit('room/leave', safeUser(users[userId])); //Скажи номер, что у них осталось
        
        socket.broadcast.to(userId).emit('room/join', safeUser(users[userId])); //Трансляции пользователей 
        users[userId].room = userId; //Поставить пользователя обратно в свою комнату
        users[userId].socket.join(userId); //Войти в комнату (после эфира)
        rooms[userId].push(userId); //отправит в общий лист
        
        //Сейчас их обслуживает код проекта
        var roomId = users[userId].room;
        var roomOwner = getOldestUser(userId, true); //Пропустить владельца, который является оригинальным пользователей
        roomOwner.socket.emit('code/all/get', userId);
    });


    socket.on('code/all/get', function () {
        //Получить код от хозяина комната
        var roomId = users[id].room;
        var roomOwner = getOldestUser(roomId);
        if (!roomOwner) return;
        roomOwner.socket.emit('code/all/get', id);
    });
    socket.on('code/delete', function (fileId) {
        if (!users[id]) return;
        socket.to(users[id].room).emit('code/delete', fileId);
    });
    socket.on('code/add', function (file) {
        if (!users[id]) return;
        socket.to(users[id].room).emit('code/add', file);
    });
    socket.on('code/change', function (data) {
        if (!users[id]) return;
        socket.to(users[id].room).emit('code/change', data); //{fileId, change}
    });
    socket.on('code/all/serve', function (data) {
        var requester = users[data.userId];
        if (requester && requester.room === users[id].room){
             requester.socket.emit('code/all/serve', data.fileTree);
        }
    });
    socket.on('code/cursor', function(data){
        if (!users[id]) return;
        data.userId = id;
        socket.to(users[id].room).emit('code/cursor', data); //{userId, fileId, {x,y}}
    });

});


var appEnv = cfenv.getAppEnv();
server.listen(appEnv.port);
console.log("Freeing the web at " + appEnv.url);

