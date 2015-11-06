// ########################################################################
var flowModule = angular.module("flow", ['bd.sockjs', 'infinite-scroll'])
flowModule.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
});
flowModule.factory('mySocket', function (socketFactory) {
    return socketFactory({
        url: '/messages'
    });
});
flowModule.controller("flowController", function($scope, mySocket, $timeout) {
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
                    var logEntry = $scope.queue.shift();
                    $scope.items.push(logEntry)
                }
                $scope.removeFromQueue()
            }, $scope.waitBeforeNextApplyTimeout);
        }
        $scope.removeFromQueue()
        $scope.clear = function () {
            $scope.items = [];
        }
        mySocket.setHandler('message', function addMessage(event) {
            var data = $.parseJSON(event.data);
            data.level = data.level.levelStr
            var date = moment(new Date(data.timeStamp)).format("YYYY-MM-DD HH:mm:ss")
            data.date = date
            var user = data.properties ? '('+data.properties.userLogin+','+data.properties.sessionId+')' : ""
            data.user = user
            var formattedMessage = data.formattedMessage
            // XXX Нормально парсить в строку нужно нам
            if ((formattedMessage + " ").indexOf('\n')!= -1) {
                formattedMessage = safeTags(formattedMessage)
                var msgParts = formattedMessage.split('\n')
                data.formattedMessage = ""
                data.msgParts = msgParts
            }
            $scope.addToQueue(data)
        })
        $scope.byLevel = function(log){
            if ($scope.showTrace && log.level == 'TRACE') return true
            if ($scope.showDebug && log.level == 'DEBUG') return true
            if ($scope.showInfo && log.level == 'INFO') return true
            if ($scope.showWarn && log.level == 'WARN') return true
            if ($scope.showError && log.level == 'ERROR') return true
            return false;
        };
    }
);