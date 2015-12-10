function flowController($scope, $stompie, $timeout, $stateParams, $interval, localStorageService, utils) {
    $scope.VISIBLE_LOGS_QUANTITY = 100
    $scope.VISIBLE_LOGS_LOAD_COUNT = 10
    $scope.REMOVE_FROM_QUEUE_INTERVAL = 100
    $scope.logSearchValue = '';
    $scope.isStopped = false; // остановили обновление страницы
    $scope.pageLogLimit = $scope.VISIBLE_LOGS_QUANTITY;
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
        $scope.pageLogLimit += $scope.VISIBLE_LOGS_LOAD_COUNT
    }
    $scope.whenScrolledUp = function () {
        $scope.pageLogLimit = $scope.VISIBLE_LOGS_QUANTITY
    }
    $scope.removeFromQueue = function (applyScope) {
        $timeout(function () {
            applyScope = false
            if ($scope.queue.length != 0 && !$scope.isStopped) {
                // Возможно нужно добавлять порциями
                var times = $scope.getTimes($scope.queue)
                for (var t = 0; t < times; t++) {
                    var logEntry = $scope.queue.shift();
                    $scope.items.push(logEntry)
                    applyScope = true
                }
            }
            $scope.removeFromQueue(applyScope)
        }, $scope.REMOVE_FROM_QUEUE_INTERVAL, applyScope);
    }
    //XXX
    $scope.getTimes = function (queue) {
        if (queue.length > 1000) return 1000;
        if (queue.length > 100) return 100;
        if (queue.length > 10) return 10;
        return 1;
    };
    $scope.removeFromQueue(false)
    $scope.clear = function () {
        $scope.items = [];
    }
    $scope.onMessageReceive = function(event) {
        $scope.addToQueue(event)
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
    $scope.CHART_CAPACITY = 500
    $scope.CHART_UPDATE_INTERVAL = 1000
    $scope.CHART_SKIP_ZERO_TICKS = false
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
    $scope.updateChart = function() {
        $timeout(function () {
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
                    //console.warn(newVal)
                    $scope.prevVal = newVal
                }
            }
            $scope.t = $scope.items.length
            $scope.updateChart()
        }, $scope.CHART_UPDATE_INTERVAL, true);
    }
    $scope.updateChart()
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