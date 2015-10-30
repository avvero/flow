
var logPerPage = 1000
var waitBeforeNextApplyTimeout = 100
var applyRemainsTimeout = 1000

// ########################################################################
    var flowModule = angular.module("flow", [])
    flowModule.filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    });
    flowModule.controller("flowController",
        function($scope) {
            $scope.waitToApply = 0; // ждут обновления
            $scope.canApply = true; // включенность возможности обновления
            $scope.isStopApply = false; // остановили обновление страницы
            // Уровни событий
            $scope.showDebug = true;
            $scope.showInfo = true;
            $scope.showWarn = true;
            $scope.showError = true;
            $scope.changeShowDebug = function () {
                $scope.showDebug = !$scope.showDebug;
            }
            $scope.changeShowInfo = function () {
                $scope.showInfo = !$scope.showInfo;
            }
            $scope.changeShowWarn = function () {
                $scope.showWarn = !$scope.showWarn;
            }
            $scope.changeShowDanger = function () {
                $scope.showError = !$scope.showError;
            }
            $scope.byLevel = function(log){
                if ($scope.showDebug && (log.level == 'DEBUG' || log.level == 'TRACE')) return true
                if ($scope.showInfo && log.level == 'INFO') return true
                if ($scope.showWarn && log.level == 'WARN') return true
                if ($scope.showError && log.level == 'ERROR') return true
                return false;
            };
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
                        $scope.$apply();
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
                    $scope.$apply();
                    $scope.waitBeforeNextApply();
                } else {
                    // Обновим остатки
                    $scope.applyRemains()
                }
            };
            $scope.stopApply = function () {
                $scope.isStopApply = !$scope.isStopApply;
            }
            //------------------
            $scope.LogFlow = {
                init : function(){
                    var sock = new SockJS('/messages');
                    sock.onopen = function () {
                        addMessage('Connected')
                    };
                    sock.onmessage = function (e) {
                        addMessage(JSON.parse(e.data))
                    };
                    sock.onclose = function () {
                        addMessage("Server closed connection or hasn't been started")
                    };
                    function addMessage(data) {
                        //var data = $.parseJSON(response.responseBody);
                        if (data.level == "ERROR") {
                            data.level
                        }
                        var date = moment(new Date(data.timeStamp)).format("YYYY-MM-DD HH:mm:ss")
                        data.date = date
                        var user = data.properties ? '('+data.properties.userLogin+','+data.properties.sessionId+')' : ""
                        data.user = user
                        var message = data.message
                        // XXX Нормально парсить в строку нужно нам
                        if ((message + " ").indexOf('\n')!= -1) {
                            message = safeTags(message)
                            var msgParts = message.split('\n')
                            data.message = ""
                            data.msgParts = msgParts
                        }
                        $scope.addLimitLogEntry(data)
                    }
                }
            };
            $scope.LogFlow.init()
        }
    );