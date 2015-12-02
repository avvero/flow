function flowController($scope, $stompie, $timeout, $stateParams, localStorageService) {
    $scope.visibleLogsCapacity = 50
    $scope.visibleLogsLoadCount = 10
    $scope.waitBeforeNextApplyTimeout = 10

    $scope.isStopped = false; // остановили обновление страницы
    $scope.pageLogLimit = $scope.visibleLogsCapacity;
    // События
    $scope.items = [];
    $scope.queue = [];
    $scope.remove = function (index) {
        $scope.items.splice(index, 1);
    }
    $scope.addToQueue = function (logEntry) {
        $scope.queue.push(logEntry)
    }
    $scope.whenScrolledDown = function () {
        $scope.pageLogLimit += $scope.visibleLogsLoadCount
    }
    $scope.whenScrolledUp = function () {
        $scope.pageLogLimit = $scope.visibleLogsCapacity
    }
    $scope.removeFromQueue = function () {
        $timeout(function () {
            if ($scope.queue.length != 0 && !$scope.isStopped) {
                // Возможно нужно добавлять порциями
                var times = $scope.getTimes($scope.queue)
                for (var t = 0; t < times; t++) {
                    var logEntry = $scope.queue.shift();
                    $scope.items.push(logEntry)
                }
            }
            $scope.removeFromQueue()
        }, $scope.waitBeforeNextApplyTimeout);
    }
    //XXX
    $scope.getTimes = function (queue) {
        if (queue.length > 1000) return 1000;
        if (queue.length > 100) return 100;
        if (queue.length > 10) return 10;
        return 1;
    };
    $scope.removeFromQueue()
    $scope.clear = function () {
        $scope.items = [];
    }
    $scope.addMessage = function(event) {
        var data = event;
        data.level = data.level.levelStr
        var date = moment(new Date(data.timeStamp)).format("YYYY-MM-DD HH:mm:ss")
        data.date = date
        var user = data.properties ? '(' + data.properties.userLogin + ',' + data.properties.sessionId + ')' : ""
        data.user = user
        var formattedMessage = data.formattedMessage
        // XXX Нормально парсить в строку нужно нам
        if ((formattedMessage + " ").indexOf('\n') != -1) {
            //formattedMessage = safeTags(formattedMessage)
            formattedMessage = $scope.fxPostProcess(formattedMessage)

            if (formattedMessage.split('\n').length > 1) {
                // 1 строка идет в основной лог
                var firstLine = formattedMessage.split('\n')[0]

                var multiLineMessage = formattedMessage.replace(firstLine + '\n', '')
                multiLineMessage = vkbeautify.xml(multiLineMessage);
                multiLineMessage = safeTags(multiLineMessage);
                multiLineMessage = multiLineMessage.replaceAll('\n', '<br/>')

                data.formattedMessage = firstLine
                data.formattedMultiLineMessage = multiLineMessage
            }
        }
        $scope.addToQueue(data)
    }
    $scope.whenScrolledUp = function () {
        $scope.pageLogLimit = $scope.visibleLogsCapacity
    }
    /***
     * STOMP
     */
    $scope.stompClient = $stompie
    $stompie.using('/messages/flow', [
        function () {$stompie.subscribe($stateParams.marker, $scope.addMessage)}
    ]);
    /**
     * При закрытии делаем disconnect
     */
    $scope.$on('$destroy', function() {
        // TODO когда-нибудь будем делать, но не сейчас
    })
    $scope.fxPostProcess = function (text) {
        return text
            .replaceAll("******* ******** ********** *******", '')
            .replaceAll("----------------------------", '')
            .replaceAll("---------------------------", '')
            .replaceAll("-----------", '')
            .replaceAll("----------", '')
        //.replaceAll("******* ********", '')
        //.replaceAll("********** *******", '')
    }
    /**
     * VIEW
     */
        // Уровни событий
    $scope.showDebug = true;
    $scope.showInfo = true;
    $scope.showWarn = true;
    $scope.showError = true;
    $scope.showTrace = true;
    $scope.scrollToTop = function() {
        $('.flow')[0].scrollTop = 0
    }

    $scope.getButtonItemLengthClass = function (length, d1, d2) {
        if (length <= d1) return 'btn-success'
        if (length > d1 && length < d2) return 'btn-warning'
        if (length >= d2) return 'btn-danger'
    }
    $scope.setBoolOption = function(option) {
        var value = !!localStorageService.get(option)
        localStorageService.set(option, !value)
    }
    $scope.isOptionOn = function(prop) {
        return !!localStorageService.get(prop)
    }
}