var flow = angular.module("flow", [
    'ngRoute',
    'ui.router',
    'ngSanitize',
    'infinite-scroll',
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