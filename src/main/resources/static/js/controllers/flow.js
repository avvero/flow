function flowController($scope, $stompie, $timeout, $stateParams, localStorageService, $uibModal, page, context, $location) {
    $scope.VISIBLE_LOGS_QUANTITY = 100  // количество элементов на странице
    $scope.SCROLL_TO_TOP_THRESHOLD = 1 // позиция каретки, полсе который будет показана кнопка Scroll to top
    $scope.REMOVE_FROM_QUEUE_INTERVAL = 100
    $scope.logFilterValue = '';
    $scope.logSearchValue = '';
    $scope.isStopped = false; // остановили обновление страницы
    $scope.pageLogLimit = $scope.VISIBLE_LOGS_QUANTITY;
    $scope.currentMarker = $stateParams.marker
    $scope.markers = context.markers
    page.setTitle(context.instance.name + ' #'+ $stateParams.marker)
    // События
    $scope.items = [];
    $scope.caret = {
        position: 0,
        min: 0,
        max: 1000
    }
    $scope.caret2 = {
        position: 0
    }
    $scope.setMark = function (entry, mark) {
        entry[mark] = !entry[mark]
    }
    $scope.chooseEntry = function(entry) {
        $scope.caret.position = $scope.items.length - entry.idx - 1
    }
    /* QUEUE */
    $scope.queue = [];
    $scope.remove = function (index) {
        $scope.items.splice(index, 1);
    }
    $scope.addToQueue = function (logEntry) {
        $scope.queue.push(logEntry)
    }
    $scope.mouseWheel = function($event, $delta, $deltaX, $deltaY) {
        if ($delta < 0) { // load more items before you hit the top
            if ($scope.caret.position > 0) {
                $scope.caret.position -= 1
            }
        } else {
            var raw = $('.flow')[0]
            if ($scope.caret.position <= $scope.items.length - $scope.VISIBLE_LOGS_QUANTITY) {
            //if (raw.scrollHeight - 20 > raw.clientHeight) {
                $scope.caret.position += 1
            }
        }
        var row = $('.flow')[0]
        console.warn("scrollTop " + row.scrollTop)
        console.warn("scrollHeight " + row.scrollHeight)
        console.warn("clientHeight " + row.clientHeight)
    }
    $scope.removeFromQueue = function (applyScope) {
        $timeout(function () {
            applyScope = false
            if ($scope.queue.length != 0 && !$scope.isStopped) {
                // Возможно нужно добавлять порциями
                var times = $scope.getTimes($scope.queue)
                for (var t = 0; t < times; t++) {
                    var logEntry = $scope.queue.shift();
                    logEntry.idx = $scope.items.length
                    $scope.items.push(logEntry)
                    applyScope = true
                    var raw = $('.flow')[0]
                    raw.scrollTop = raw.scrollHeight - raw.clientHeight
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
    $scope.onMessageReceive = function (event) {
        $scope.addToQueue(event)
    }
    /***
     * STOMP
     */
    $scope.stompClient = $stompie
    $scope.stompSubscription = null
    $stompie.using('/messages/flow', [
        function () {
            $scope.stompSubscription = $stompie.subscribe($stateParams.marker, $scope.onMessageReceive)
        }
    ]);
    /**
     * При закрытии делаем disconnect
     */
    $scope.$on('$destroy', function () {
        //$scope.stompSubscription.unsubscribe()
        $scope.stompClient.disconnect()
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
    $scope.scrollToTop = function () {
        if ($scope.items.length - 1 > 0) {
            $scope.caret.position = $scope.items.length - $scope.VISIBLE_LOGS_QUANTITY
            $('.flow')[0].scrollTop = 0
        }
    }
    $scope.scrollToBottom = function () {

        var raw = $('.flow')[0]
        raw.scrollTop = raw.scrollHeight - raw.clientHeight
        $scope.caret.position = 0
    }
    $scope.showSettings = false;
    $scope.showSearch = false;

    $scope.getButtonItemLengthClass = function (length, d1, d2) {
        if (length <= d1) return 'btn-success'
        if (length > d1 && length < d2) return 'btn-warning'
        if (length >= d2) return 'btn-danger'
    }

    $scope.showOptionsDialog = function () {
        var options = {
            showMdc: $scope.isOptionOn('view.showMdc'),
            showChart: $scope.isOptionOn('view.showChart'),
            isDebugMode: $scope.isOptionOn('app.isDebugMode')
        }
        var modalInstance = $uibModal.open({
            templateUrl: '/views/options.html',
            controller: optionsDialogController,
            resolve: {
                options: function ($q, $http) {
                    var deferred = $q.defer();
                    deferred.resolve(options)
                    return deferred.promise;
                }
            }
        });
        modalInstance.result.then(function (options) {
            $scope.setOption('view.showMdc', options.showMdc)
            $scope.setOption('view.showChart', options.showChart)
            $scope.setOption('app.isDebugMode', options.isDebugMode)
        }, function () {

        });
    }

    /**
     * LocalStorage
     *
     */
    $scope.optionCache = {}
    $scope.changeBoolOption = function (option) {
        var value = !!localStorageService.get(option)
        var newValue = !value
        localStorageService.set(option, newValue)

        $scope.optionCache[option] = newValue
    }
    $scope.setOption = function (option, value) {
        localStorageService.set(option, value)

        $scope.optionCache[option] = value
    }
    $scope.isOptionOn = function (option) {
        if (typeof($scope.optionCache[option]) == "undefined") {
            $scope.optionCache[option] = !!localStorageService.get(option)
        }
        return $scope.optionCache[option]
    }
    $scope.setDefaultOption = function (option, value) {
        if (localStorageService.get(option) == null) {
            $scope.setOption(option, value)
        }
    }
    $scope.setDefaultOption('view.showMdc', true)
    $scope.setDefaultOption('view.showChart', false)
    $scope.setDefaultOption('view.hideHelp', false)
    $scope.setDefaultOption('app.isDebugMode', false)
}

flowController.resolve = {
    context: function ($q, $http, $stateParams) {
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: '/data/context',
            headers: {'Content-Type': 'application/json;charset=UTF-8'}
        })
            .success(function (data) {
                deferred.resolve(data)
            })
            .error(function (data) {
                deferred.reject("error value");
            });

        return deferred.promise;
    }
}