function flowController($scope, $stompie, $timeout, $stateParams, localStorageService) {
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
    $scope.removeFromQueue(false)
    //XXX
    $scope.getTimes = function (queue) {
        if (queue.length > 1000) return 1000;
        if (queue.length > 100) return 100;
        if (queue.length > 10) return 10;
        return 1;
    };
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