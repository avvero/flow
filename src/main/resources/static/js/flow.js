
var logPerPage = 10000
var waitBeforeNextApplyTimeout = 10
var applyRemainsTimeout = 1000

// ########################################################################
var flowModule = angular.module("flow", ['bd.sockjs'])
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
        $scope.isStopped = false; // остановили обновление страницы
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
        $scope.removeFromQueue = function() {
            $timeout(function() {
                if ($scope.queue.length != 0 && !$scope.isStopped)  {
                    var logEntry = $scope.queue.shift();
                    $scope.items.push(logEntry)
                }
                $scope.removeFromQueue()
            }, waitBeforeNextApplyTimeout);
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
    }
);