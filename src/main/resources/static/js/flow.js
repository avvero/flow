function flowController($scope, $stompie, $timeout, $stateParams, $indexedDB) {
    $scope.visibleLogsCapacity = 50
    $scope.visibleLogsLoadCount = 10
    $scope.REMOVE_FROM_QUEUE_IDLE = 10
    $scope.REMOVE_FROM_STORE_QUEUE_IDLE = 3000
    $scope.idx = 0

    $scope.isStopped = false; // остановили обновление страницы
    $scope.pageLogLimit = $scope.visibleLogsCapacity;
    // Уровни событий
    $scope.showDebug = true;
    $scope.showInfo = true;
    $scope.showWarn = true;
    $scope.showError = true;
    $scope.showTrace = true;
    // События
    $scope.items = [];
    $scope.queue = [];
    $scope.toStoreQueue = [];
    $scope.remove = function (index) {
        $scope.items.splice(index, 1);
    }
    $scope.addToItems = function (logEntry) {
        $scope.items.push(logEntry)
        if ($scope.items.length > 200 - 1) {
            $scope.items.splice(0, 100)
        }
    }
    $scope.addToQueue = function (logEntry) {
        $scope.queue.push(logEntry)
    }
    $scope.changePageLogLimit = function () {
        $scope.pageLogLimit += $scope.visibleLogsLoadCount
    }
    $scope.removeFromQueue = function () {
        $timeout(function () {
            if ($scope.queue.length != 0 && !$scope.isStopped) {
                // Возможно нужно добавлять порциями
                var times = $scope.getTimes($scope.queue)
                var toStore = []
                for (var t = 0; t < times; t++) {
                    var logEntry = $scope.queue.shift();
                    $scope.addToItems(logEntry)
                    $scope.toStoreQueue.push(logEntry)
                }
            }
            $scope.removeFromQueue()
        }, $scope.REMOVE_FROM_QUEUE_IDLE);
    }
    $scope.removeFromQueue()
    $scope.removeFromStoreQueue = function () {
        $timeout(function () {
            if ($scope.toStoreQueue.length != 0) {
                // Возможно нужно добавлять порциями
                var toStore = []
                var length = $scope.toStoreQueue.length
                for (var t = 0; t < length; t++) {
                    var logEntry = $scope.toStoreQueue.shift();
                    toStore.push(logEntry)
                }
                if (toStore.length > 0) {
                    $indexedDB.openStore('log', function (store) {
                        store.insert(toStore).then(function (e) {
                            console.info("Inserted " + e.length)
                        });
                    })
                }
            }
            $scope.removeFromStoreQueue()
        }, $scope.REMOVE_FROM_STORE_QUEUE_IDLE);
    }
    $scope.removeFromStoreQueue()
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
        var data = $scope.parseMessage(event)
        data['idx'] = $scope.idx++
        $scope.addToQueue(data)
    }
    $scope.parseMessage = function (event) {
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
        return data;
    }
    $scope.newFilter = {
        levels: function () {
            return [$scope.showTrace ? 'TRACE' : '',
                $scope.showDebug ? 'DEBUG' : '',
                $scope.showInfo ? 'INFO' : '',
                $scope.showWarn ? 'WARN' : '',
                $scope.showError ? 'ERROR' : ''
            ]
        },
        check: function (entry) {
            return $.inArray(entry.level, this.levels()) >= 0;
        }
    }
    $scope.byNewFilter = function (log) {
        return $scope.newFilter.check(log);
    };
    $scope.whenScrolledUp = function() {
        console.info("whenScrolledUp")
        $scope.loadMore()
    }
    $scope.loadMore = function() {
        var firstElement = $scope.items[0]
        if (!firstElement) return

        var list = $scope.getFromStore(firstElement.idx, 10)
        //$scope.items = list.concat($scope.items)
    }
    $scope.getFromStoreLock = false;
    $scope.getFromStore = function(before, count){
        if ($scope.getFromStoreLock) return;
        $scope.getFromStoreLock = true;

        $indexedDB.openStore('log', function(store){
            var result = []
            var count = 100;
            store.store.openCursor(null, "prev").onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    if(cursor.value.idx < before && result.length <= count ) {
                        var entry = cursor.value
                        if ($scope.newFilter.check(entry)) {
                            result.unshift(entry)
                        }
                    }
                    cursor.continue();
                } else {
                    //alert("No more entries!");
                    console.info("Fetched" + result.length)
                    if (result.length > 0) {
                        $scope.items = result.concat($scope.items)
                    }
                    $scope.getFromStoreLock = false
                }
            }
        });
    }
    /**
     * bottom scroll
     */
    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
        //console.info("ngRepeatFinished")
        //window.scrollTo(0,document.body.scrollHeight);
    });
    /***
     * STOMP
     */
    $scope.stompClient = $stompie
    $stompie.using('/messages/flow', [
        function () {
            $stompie.subscribe($stateParams.marker, $scope.onMessageReceive)
        }
    ]);
    /**
     * При закрытии делаем disconnect
     */
    $scope.$on('$destroy', function () {
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
    $scope.byLevel = function (log) {
        if ($scope.showTrace && log.level == 'TRACE') return true
        if ($scope.showDebug && log.level == 'DEBUG') return true
        if ($scope.showInfo && log.level == 'INFO') return true
        if ($scope.showWarn && log.level == 'WARN') return true
        if ($scope.showError && log.level == 'ERROR') return true
        return false;
    };

    /**
     * VIEW
     */
    $scope.getButtonItemLengthClass = function (length, d1, d2) {
        if (length <= d1) return 'btn-success'
        if (length > d1 && length < d2) return 'btn-warning'
        if (length >= d2) return 'btn-danger'
    }
}