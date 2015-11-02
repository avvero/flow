
var logPerPage = 10000
var waitBeforeNextApplyTimeout = 100
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
flowModule.controller("flowController", function($scope, mySocket) {
        $scope.waitToApply = 0; // ждут обновления
        $scope.canApply = true; // включенность возможности обновления
        $scope.isStopApply = false; // остановили обновление страницы
        // Уровни событий
        $scope.showDebug = true;
        $scope.showInfo = true;
        $scope.showWarn = true;
        $scope.showError = true;
        $scope.showTrace = true;
        // События
        $scope.items = [];
        $scope.remove = function(index) {
            $scope.items.splice(index, 1);
        }
        $scope.waitBeforeNextApply = function() {
            $scope.canApply = false;
            setTimeout(function() { $scope.canApply = true }, waitBeforeNextApplyTimeout);
        }
        $scope.applyRemains = function() {
            setTimeout(function() {
                // Если обновлять можно и есть остатки (зависли), то обновим страницу
                if (!$scope.isStopApply && $scope.waitToApply > 0) {
                    $scope.waitToApply = 0
                    //$scope.$apply();
                    $scope.waitBeforeNextApply();
                }
            }, applyRemainsTimeout);
        }
        $scope.addLimitLogEntry = function (log) {
            // Не выходим за лимит
            if ($scope.items.length > logPerPage) {
                $scope.items.splice(0,1);
            }
            $scope.items.push(log);
            $scope.waitToApply += 1
            // Если можно обновить, то обновим и поставим ожидалку
            if ($scope.canApply && !$scope.isStopApply) {
                $scope.waitToApply = 0
                //$scope.$apply();
                $scope.waitBeforeNextApply();
            } else {
                // Обновим остатки
                $scope.applyRemains()
            }
        };
        $scope.stopApply = function () {
            $scope.isStopApply = !$scope.isStopApply;
        }
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
            $scope.addLimitLogEntry(data)
        })
    }
);