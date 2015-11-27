function flowController($scope, $stompie, $timeout, $stateParams, $indexedDB) {
    $scope.visibleLogsCapacity = 50
    $scope.visibleLogsLoadCount = 10
    $scope.waitBeforeNextApplyTimeout = 1
    $scope.stored = 0
    $scope.reccived = 0

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
    $scope.remove = function (index) {
        $scope.items.splice(index, 1);
    }
    $scope.loadMore = function() {
        var firstElement = $scope.items[0]
        if (!firstElement) return

        var list = $scope.getFromStore(firstElement.id, 10)
        //$scope.items = list.concat($scope.items)
    }
    $scope.getFromStore = function(before, count){
        $indexedDB.openStore('log', function(store){
            var start = before-101
            var find = store.query();
            find = find.$between(start, before, true, false);
            // update scope
            store.eachWhere(find).then(function(storedItems){
                if (storedItems.length > 0) {
                    var lastIdx = before
                    for(var i = storedItems.length-1; i >= 0; i--){
                        //storedItems[i]['id'] = --lastIdx
                        storedItems[i]= $scope.parseMessage(storedItems[i]);
                    }
                    $scope.items = storedItems.concat($scope.items)
                }
            });
        });
    }
    $scope.addToQueue = function (logEntry) {
        $timeout(function () {
            if ($scope.items.length > 200) {
                console.info("Length " +  $scope.items.length)
                var toStore = $scope.items.splice(0, 100-1)
                console.info("Will store " + toStore.length)
                $indexedDB.openStore('log', function (store) {
                    console.info("Start store " + toStore.length)
                    store.insert(toStore).then(function (e) {
                        console.info("Inserted " + e.length)
                        //message['id'] = e[0]-1 //TODO
                        //$scope.addMessage(message)
                    });
                })
                //$scope.items = $scope.items.splice(20, $scope.items.length-1)
                console.info("Will pass " + $scope.items.length)
            }
            $scope.items.push(logEntry)
        }, $scope.waitBeforeNextApplyTimeout);
    }
    $scope.changePageLogLimit = function () {
        $scope.pageLogLimit += $scope.visibleLogsLoadCount
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
    $scope.addMessage = function (event) {
        var data = $scope.parseMessage(event);
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
        return data
    }
    $scope.idx = 0
    $scope.onMessageReceive = function (message) {
        console.info("Reccived " + ++$scope.reccived)
        message['id'] = $scope.idx++
        $scope.addMessage(message)
    }
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