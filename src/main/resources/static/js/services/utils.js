angular.module('flow').service('utils', function () {
    return {
        safeTags: function (str) {
            return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll(' ', '&nbsp;');
        },
        pushToArray: function (array, value, limit) {
            while (array.length >= limit) {
                array.shift()
            }
            array.push(value)
        },
        fxPostProcess: function (text) {
            return text
                .replaceAll("******* ******** ********** *******", '')
                .replaceAll("----------------------------", '')
                .replaceAll("---------------------------", '')
                .replaceAll("-----------", '')
                .replaceAll("----------", '')
                .replaceAll("******* ********", '')
                .replaceAll("********** *******", '')
                .replaceAll("*******", '')
        },
        parseLogbackLogEntry: function(event) {
            var data = event;
            data.level = data.level.levelStr
            var date = moment(new Date(data.timeStamp)).format("YYYY-MM-DD HH:mm:ss")
            data.date = date
            var user = data.properties ? '(' + data.properties.userLogin + ',' + data.properties.sessionId + ')' : ""
            data.user = user
            var formattedMessage = data.formattedMessage
            // XXX Нормально парсить в строку нужно нам
            if ((formattedMessage + " ").indexOf('\n') != -1) {
                formattedMessage = utils.fxPostProcess(formattedMessage)

                if (formattedMessage.split('\n').length > 1) {
                    // 1 строка идет в основной лог
                    var firstLine = formattedMessage.split('\n')[0]

                    var multiLineMessage = formattedMessage.replace(firstLine + '\n', '')
                    multiLineMessage = vkbeautify.xml(multiLineMessage);
                    multiLineMessage = utils.safeTags(multiLineMessage);
                    multiLineMessage = multiLineMessage.replaceAll('\n', '<br/>')

                    data.formattedMessage = firstLine
                    data.formattedMultiLineMessage = multiLineMessage
                }
            }
            if (data.throwableProxy && data.throwableProxy.cause && data.throwableProxy.cause.message.split('\n').length > 1) {
                data.throwableProxy.cause.message = data.throwableProxy.cause.message.replaceAll('\n', '<br/>')
            }
            return data
        }
    }
})