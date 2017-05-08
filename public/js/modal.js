/* 

modal.js

A custom modal/dialog module

Thomas Mullen 2016

*/
var Modal = (function (Microstache) {
    'use strict';

    var my = {

            /* Dictionary mapping names to mustache templates */
            templates: {},

            /* 
            Specifies a callback for the modal
            Callback will receive text of button clicked, and an array of any form inputs
            */
            next: function (modalName, callback) {
                nextFunction[modalName] = callback;
            },

            /* Opens a modal */
            open: function (templateName, data) {
                if (!data) {
                    data = {};
                }
                if (!my.templates[templateName]) {
                    window.console.error("No template with name " + templateName);
                }
                modalElement.innerHTML = Microstache.template(my.templates[templateName], data);
                modalElement.className = "modal text-center theme-dark-border " + templateName;
                modalElement.style.display = 'block';
                blockingElement.style.display = 'block';
                state = templateName;

                var primaryInput = document.querySelector('.modal-input');
                if (primaryInput && !inIframe()) {
                    primaryInput.focus();
                }
            },

            /* Closes any modal */
            close: function () {
                modalElement.style.display = 'none';
                blockingElement.style.display = 'none';
                state = 'closed';

            }


        };
    
    var modalElement = document.getElementById("modal"),
        blockingElement = document.getElementById("blocking-overlay"),
        state = 'closed',
        nextFunction = {};

    function inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    document.querySelector('#modal').addEventListener('click', function (event) {
        if (event.target.tagName.toLowerCase() === 'button') {
            var clicked = event.target.dataset.value,
                input = Array.prototype.slice.call(document.querySelectorAll('.modal-input')).map(
                    function (e) {
                        return e.value;
                    });
            if (clicked === 'close') {
                Modal.close();
            } else {
                if (nextFunction[state]) {
                    nextFunction[state](clicked, input);
                } else {
                    window.console.error("Modal '" + state + "' has no next function!");
                }

            }
        }
    });
    document.querySelector('body').addEventListener('keyup', function (event) {
        if (event.keyCode === 13 && state !== 'closed') {
            var input = Array.prototype.slice.call(document.querySelectorAll('.modal-input')).map(function (e) {
                return e.value;
            });
            if (typeof nextFunction[state] === 'function') {
                nextFunction[state]('submit', input);
            } else {
                my.close();
            }
        }
    });
    
    
    return my;
}(Microstache));

/* Modal definitions */
Modal.templates['intro'] = `<h1>WELCOME</h1>
    <h3>My Diplom Project</h3>
    <p>Vadim khamitsevich</p>
    <br>
    <input class="modal-input" type="text" placeholder="guest">
    <button data-value="submit" class="go-button">OK</button>
    <p>{{flash}}</p>
`;

Modal.templates['welcome'] = `<h1>Добро пожаловать!</h1>
    <h3>Привет!</h3>
    <p>Теперь вы готовы использовать Онлайн редактор кода</p>
    <p>Сервис использует технологию websocket для подключения с любого устройства</p>
    <br>
    <button data-value="close" class="no-button">Я разберусь</button>
    <button data-value="submit" class="go-button">Подробнее</button>`;

Modal.next('welcome', function (button, input) {
    Modal.open('welcome-2');
});

Modal.templates['welcome-2'] = `<h1>Добро пожаловать!</h1>
    <h3>Как пользоваться?</h3>
    <p>Присоединиться к другому пользователю, просто кликните на его аватар в панели "онлайн" (внизу слева).</p>
    <p>Вам будет предоставлена возможность войти в их комнату. Если они принимают, вы можете присоединиться к их проекту.</p>
    <br>
    <button data-value="close" class="no-button">Я понял</button>
    <button data-value="submit" class="go-button">Подробнее</button>`;

Modal.next('welcome-2', function (button, input) {
    Modal.open('welcome-3');
});

Modal.templates['welcome-3'] = `<h1>Добро пожаловать!</h1>
    <p>Синхронизация проекта, для его работы в любом месте и с любого устройства!</p>
    <p>Возможен импорт и загрузка файлов из своего компьютера!</p>
    <br>
    <button data-value="close" class="no-button">Я понял</button>
    <button data-value="submit" class="go-button">Подробнее</button>`;

Modal.next('welcome-3', function (button, input) {
    Modal.open('welcome-4');
});


Modal.templates['welcome-4'] = `<h1>Добро пожаловать!</h1>
    <h3>Как подключиться</h3>
    <p>Писать код и писать сообщения - неудобно, чтобы общаться. Потому сервис имеет голосовой чат!</p>
    <p>Используйте кнопку микрофона в верхнем правом углу, чтобы присоединиться к голосовому чату.</p>
    <br>
    <button data-value="close" class="no-button">Я понял</button>
    <button data-value="submit" class="go-button">Подробнее</button>`;

Modal.next('welcome-4', function (button, input) {
    Modal.open('welcome-5');
});



Modal.templates['welcome-5'] = `<h1>Добро пожаловать!</h1>
    <h3>Сделать что-то потрясающее</h3>
    <p>Вперед! Сделай что-то потрясающее, удиви мир!
    <br><br>
    <button data-value="submit" class="go-button">Начать!</button>`;

Modal.next('welcome-5', function (button, input) {
    Modal.close();
});


Modal.templates["requestInvite"] = `<h1>Запрос на присоединение {{name}}'s к комнате?</h1>
<p>Вы получите уведомление, если ваш запрос примут</p>
    <button data-value="submit" class="go-button">Пригласить</button>
    <button data-value="close" class="no-button">Отклонить</button>`;

Modal.templates["createFile"] = `<h1>Создать новый...</h1>
    <input class="modal-input" placeholder="Name" type="text">
    <br>
    <button data-value="file" class="go-button">Файлы</button>
    <button data-value="folder" class="go-button">Папки</button>
    <input id="fileUpload" class="go-button" type="file" multiple />
    <button data-value="github" class="go-button">GitHub</button>
    <br>
<button data-value="close" class="no-button">Отмена</button>
<p>{{flash}}</p>`;


Modal.templates["confirmDelete"] = `<h1>Вы уверены что хотите удалить \"{{name}}\"?</h1>
<p>Он будет удален для всех в комнате!</p>
<button data-value="yes" class="go-button">Удалить</button>
<button data-value="no" class="no-button">Отмена</button>
`;

Modal.templates["confirmFolderDelete"] = `<h1>Вы уверены что хотите удалить папку <br>"{{name}}"</h1>
<p>Все содержимое папки будет удалено, вы не сможете вернуть его.</p>
<p>Он будет удален для всех в комнате!</p>
<button data-value="yes" class="go-button">Delete</button>
<button data-value="no" class="no-button">Cancel</button>
`;


Modal.templates["confirmKick"] = `<h1>Вы уверены что хотите выкинуть \"{{name}}\"?</h1>
<p>Он не вернется :)</p>
<button data-value="accept" class="go-button">Пока</button>
<button data-value="close" class="no-button">Отмена</button>
`;


Modal.templates["request-join"] = `
<h1>{{name}} хотел бы присоединиться к вашей комнате!</h1>
<p>Позволить ему просматривать и редактировать код?</p>
<button data-value="accept" class="go-button">Принять</button>
<button data-value="close" class="no-button">Отклонить</button>
`;

Modal.templates['join-response'] = `
<h1>{{name}} принял пригложение для присоединения</h1>
<p>Теперь вы можете просматривать и редактировать его код</p>
<button data-value="close" class="go-button">ОК</button>
`;

Modal.templates['kick-alert'] = `
<h1>Пока, тебя выгнали из комнаты</h1>
<button data-value="close" class="go-button">ОК</button>
`

Modal.templates['general-alert'] = `
<h1>{{title}}</h1>
<p>{{msg}}</p>
<button data-value="close" class="go-button">Ok</button>
`
Modal.next('general-alert', function () {});


Modal.templates['url'] = `
<h1>Развернуто</h1>
<p>Ваш сайт готов</p>
<p class="red"><a target="_blank" href="{{url}}">{{url}}</a></p>
<button data-value="close" class="go-button">Ok</button>
`;
Modal.next('url', function () {});


Modal.templates['github'] = `
<h1>GitHub Repo</h1>
<input class="modal-input long" type="text" placeholder="https://github.com/username/repo">
<br><br>
<input class="modal-input" type="text" placeholder="branch">
<br><br>
<button data-value="load" class="go-button">Load</button>
<button data-value="close" class="no-button">Cancel</button>
`;
Modal.next('url', function () {});



Modal.templates['themes'] = `
<h1>Выбор темы</h1>
<button style="width:95px" data-value="material" class="go-button">Ocean</button>
<button style="width:95px" data-value="atom" class="go-button">Atom</button>
<br>
<button style="width:95px" data-value="codepen" class="go-button">CodePen</button>
<button style="width:95px" data-value="brackets" class="go-button">Brackets</button>
<br>
<button data-value="close" class="no-button">Закрыть</button>
`;
Modal.next('themes', function () {});


Modal.templates['save'] = `
<h1>Сохрнить ваш проект</h1>
<p>Скачать проект как zip-архив (рекомендуется)</p>
<button  data-value="zip" class="go-button">Сохранить как ZIP</button>
<br>
<p>Сохранить проект в КЭШ браузера (временно)</p>
<button data-value="local" class="go-button">Сохранить промежуточно</button>
<br><br>
<button data-value="close" class="no-button">Отмена</button>
`;
Modal.next('save', function () {});

Modal.templates['save-confirm'] = `
<h1>Сохранить локально</h1>
<p>Проект сохранен локально!</p>
<p>Ваш браузер может очистить данные в любое время</p>
<br>
<button data-value="close" class="no-button">Закрыть</button>
`
Modal.next('save-confirm', function () {});


Modal.templates['save-fail'] = `
<h1>Ошибка сохранения</h1>
<p>Не удалось сохранить проект локально.</p>
<p>Ваш браузер может не поддерживать эту функцию, или ваш проект слишком большой.</p>
<br>
<button data-value="close" class="no-button">Close</button>
`
Modal.next('save-fail', function () {});