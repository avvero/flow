function flowController($scope, $stompie, $timeout, $stateParams, $interval, localStorageService) {
    $scope.visibleLogsCapacity = 100
    $scope.visibleLogsLoadCount = 10
    $scope.waitBeforeNextApplyTimeout = 10
    $scope.CHART_CAPACITY = 1000
    $scope.CHART_UPDATE_INTERVAL = 1000
    $scope.CHART_SKIP_ZERO_TICKS = false

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
        if (data.throwableProxy && data.throwableProxy.cause && data.throwableProxy.cause.message.split('\n').length > 1) {
            data.throwableProxy.cause.message = data.throwableProxy.cause.message.replaceAll('\n', '<br/>')
        }
        $scope.addToQueue(data)
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
            .replaceAll("******* ********", '')
            .replaceAll("********** *******", '')
            .replaceAll("*******", '')
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
    $scope.showSettings = false;

    $scope.getButtonItemLengthClass = function (length, d1, d2) {
        if (length <= d1) return 'btn-success'
        if (length > d1 && length < d2) return 'btn-warning'
        if (length >= d2) return 'btn-danger'
    }

    /**
     * Chart
     *
     */
    $scope.chartOptions = {
        animation: false,
        datasetStrokeWidth: 0.5,
        pointDot: false,
        showScale: true,
        showTooltips: false,
        scaleShowLabels: true,
        bezierCurve : true
    };
    $scope.chartSeries = ['All'];
    $scope.chartLabels = [0];
    $scope.chartTotal = [0];
    $scope.chartData = [$scope.chartTotal];

    $scope.t = 0;
    $scope.prevVal = 0;
    $interval(function () {
        if ($scope.t == 0 && $scope.items.length > 0) {
            $scope.pushToArray($scope.chartTotal, $scope.items.length, $scope.CHART_CAPACITY)
            $scope.pushToArray($scope.chartLabels, '', $scope.CHART_CAPACITY)
        } else {
            var newVal = $scope.items.length - $scope.t
            if ($scope.CHART_SKIP_ZERO_TICKS && $scope.prevVal == 0 && newVal == 0) {
                // skip zero ticks
                return;
            } else {
                $scope.pushToArray($scope.chartTotal, newVal, $scope.CHART_CAPACITY)
                $scope.pushToArray($scope.chartLabels, '', $scope.CHART_CAPACITY)
                console.warn(newVal)
                $scope.prevVal = newVal
            }
        }
        $scope.t = $scope.items.length
    }, $scope.CHART_UPDATE_INTERVAL);

    $scope.pushToArray = function(array, value, limit) {
        while(array.length >= limit) {
            array.shift()
        }
        array.push(value)
    }

    /**
     * LocalStorage
     *
     */
    $scope.optionCache = {}
    $scope.changeBoolOption = function(option) {
        var value = !!localStorageService.get(option)
        var newValue = !value
        localStorageService.set(option, newValue)

        $scope.optionCache[option] = newValue
    }
    $scope.isOptionOn = function(option) {
        if (typeof($scope.optionCache[option]) == "undefined"){
            $scope.optionCache[option] = !!localStorageService.get(option)
        }
        return $scope.optionCache[option]
    }


}