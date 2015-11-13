// ########################################################################
var flowModule = angular.module("flow", ['bd.sockjs', 'infinite-scroll'])
flowModule.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
});
flowModule.factory('logFlow', function (socketFactory) {
    return socketFactory({
        url: '/flow'
    });
});
flowModule.filter('trusted', ['$sce', function($sce){
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);
flowModule.controller("flowController", function($scope, logFlow, $timeout) {
        $scope.visibleLogsCapacity = 50
        $scope.visibleLogsLoadCount = 10
        $scope.waitBeforeNextApplyTimeout = 10

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
        $scope.remove = function(index) {
            $scope.items.splice(index, 1);
        }
        $scope.addToQueue = function(logEntry) {
            $scope.queue.push(logEntry)
        }
        $scope.changePageLogLimit = function() {
            $scope.pageLogLimit += $scope.visibleLogsLoadCount
        }
        $scope.removeFromQueue = function() {
            $timeout(function() {
                if ($scope.queue.length != 0 && !$scope.isStopped)  {
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
        logFlow.setHandler('message', function addMessage(event) {
            var data = $.parseJSON(event.data);
            data.level = data.level.levelStr
            var date = moment(new Date(data.timeStamp)).format("YYYY-MM-DD HH:mm:ss")
            data.date = date
            var user = data.properties ? '('+data.properties.userLogin+','+data.properties.sessionId+')' : ""
            data.user = user
            var formattedMessage = data.formattedMessage
            // XXX Нормально парсить в строку нужно нам
            if ((formattedMessage + " ").indexOf('\n')!= -1) {
                //formattedMessage = safeTags(formattedMessage)
                formattedMessage = $scope.fxPostProcess(formattedMessage)

                if (formattedMessage.split('\n').length > 1) {
                    // 1 строка идет в основной лог
                    var firstLine = formattedMessage.split('\n')[0]

                    var multiLineMessage = formattedMessage.replace(firstLine + '\n','')
                    multiLineMessage = vkbeautify.xml(multiLineMessage);
                    multiLineMessage = safeTags(multiLineMessage);
                    multiLineMessage = multiLineMessage.replaceAll('\n', '<br/>')

                    data.formattedMessage = firstLine
                    data.formattedMultiLineMessage = multiLineMessage
                }
            }
            $scope.addToQueue(data)
        })
        $scope.fxPostProcess = function(text) {
            return text
                .replaceAll("******* ******** ********** *******", '')
                .replaceAll("----------------------------", '')
                .replaceAll("---------------------------", '')
                .replaceAll("-----------", '')
                .replaceAll("----------", '')
                //.replaceAll("******* ********", '')
                //.replaceAll("********** *******", '')
        }
        $scope.byLevel = function(log){
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
        $scope.getButtonItemLengthClass = function(length, d1, d2){
            if (length <= d1) return 'btn-success'
            if (length > d1 && length < d2) return 'btn-warning'
            if (length >= d2) return 'btn-danger'
        }
    }
);