var Config = (function(){
    "use strict";
        
    /* -------- DO NOT BEAUTIFY ---------*/
    var initialContent = [
        {
            name: "index.html",
            fileId: "welcome",
            content: `<html>
<head>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Добро пожаловать!</h1>

    <ul>
        <li>Разработка в режиме реального времени</li>
    	<li>Подсветка синтаксиса для каждого веб-языка.</li>
    	<li>Голосовой чат с участием до 10 человек! (Только для webrtc)</li>
        <li>Импорт файлов, zip-архивов</li>
    	<li>Сохраните проект для работы в автономном режиме.</li>
    	<li>Многопользовательский редактор кода в интернете</li>
        
        <!-- Комментарии -->

        <a href="http://github.com/li4nost94" target="_blank">Мой GitHub</a>
    </ul>
</body> 
    
</html>`
        },
        {
            name: "style.css",
            fileId: "welcome2",
            content: `body {
    background: lightgray;
    font-family: Arial;
}

h1 {
    color: darkgreen;
}`
        },
        {
            name: "script.js",
            fileId: "welcome3",
            content: `var a = 1;
for (var i=0; i < 10; i++){
    //И так далее!
}`
        }
    ];
    /*-------------------------------*/
    
    return {
        FileSystem : {
            initialContent : initialContent
        },
        UI : {
            
        },
        Sockets : {
            HOSTNAME : "/", //Points at a Multihack server
            PeerJS : {
                host: "/", //Points at a slightly modified PeerJS server 
                port: 443,
                path: "/server",
                secure: true
            }
        },
    }
}());
