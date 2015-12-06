function flowController($scope, $stompie, $timeout, $stateParams, $interval, localStorageService, utils) {
    $scope.visibleLogsCapacity = 100
    $scope.visibleLogsLoadCount = 10
    $scope.waitBeforeNextApplyTimeout = 10
    $scope.CHART_CAPACITY = 500
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
    $scope.onMessageReceive = function(event) {
        var data = utils.parseLogbackLogEntry(event)
        $scope.addToQueue(data)
    }
    /***
     * STOMP
     */
    $scope.stompClient = $stompie
    $stompie.using('/messages/flow', [
        function () {$stompie.subscribe($stateParams.marker, $scope.onMessageReceive)}
    ]);
    /**
     * При закрытии делаем disconnect
     */
    $scope.$on('$destroy', function() {
        // TODO когда-нибудь будем делать, но не сейчас
    })
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
            utils.pushToArray($scope.chartTotal, $scope.items.length, $scope.CHART_CAPACITY)
            utils.pushToArray($scope.chartLabels, '', $scope.CHART_CAPACITY)
        } else {
            var newVal = $scope.items.length - $scope.t
            if ($scope.CHART_SKIP_ZERO_TICKS && $scope.prevVal == 0 && newVal == 0) {
                // skip zero ticks
                return;
            } else {
                utils.pushToArray($scope.chartTotal, newVal, $scope.CHART_CAPACITY)
                utils.pushToArray($scope.chartLabels, '', $scope.CHART_CAPACITY)
                console.warn(newVal)
                $scope.prevVal = newVal
            }
        }
        $scope.t = $scope.items.length
    }, $scope.CHART_UPDATE_INTERVAL);

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