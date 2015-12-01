var flow = angular.module("flow", [
    'ngRoute',
    'ui.router',
    'ngSanitize',
    'stompie',
    'ui.bootstrap'
])
    .filter('reverse', function () {
        return function (items) {
            return items.slice().reverse();
        };
    })
    .filter('trusted', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }])
    .filter('level', function() {
        return function(logs, showTrace, showDebug, showInfo, showWarn, showError, limit) {
            var result = []
            for (var i = 0; i < logs.length; i++){
                if (limit == result.length) {
                    break;
                }
                var level = logs[i].level
                if (showTrace && level == 'TRACE'
                    || showDebug && level == 'DEBUG'
                    || showInfo && level == 'INFO'
                    || showWarn && level == 'WARN'
                    || showError && level == 'ERROR') {
                    result.push(logs[i])
                }
            }
            return result;
        }
    })
    .directive('whenScrolledUp', ['$timeout', function($timeout) {
        return function(scope, elm, attr) {
            var raw = elm[0];

            $timeout(function() {
                raw.scrollTop = raw.scrollHeight;
            });

            elm.bind('scroll', function() {
                if (raw.scrollTop < 100) { // load more items before you hit the top
                    scope.$apply(attr.whenScrolledUp);
                }
                if ((raw.scrollHeight - raw.clientHeight - raw.scrollTop) < 100) { // load more items before you hit the top
                    scope.$apply(attr.whenScrolledDown);
                }
            });
        };
    }]);

// configure our routes
flow.config(function ($routeProvider, $stateProvider, $urlRouterProvider, $locationProvider) {

    $urlRouterProvider.otherwise("/")

    $stateProvider
        .state('index', {
            url: "/",
            views: {
                "single": {
                    templateUrl: '/view/markers.html',
                    controller: markersController,
                    resolve: markersController.resolve
                }
            }
        })
        .state('flow', {
            url: "/flow/:marker",
            views: {
                "single": {
                    templateUrl: '/view/flow.html',
                    controller: flowController
                }
            }
        })
});

flow.controller('mainController', function ($scope) {

})