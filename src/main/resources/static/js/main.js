var flow = angular.module("flow", [
    'ngRoute',
    'ui.router',
    'ngSanitize',
    'infinite-scroll',
    'stompie',
    'ui.bootstrap',
    'indexedDB'
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
flow.config(function ($routeProvider, $stateProvider, $urlRouterProvider, $indexedDBProvider) {

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

    $indexedDBProvider
        .connection('com.avvero.flow.log.'+makeid())
        .upgradeDatabase(1, function(event, db, tx){
            var objStore = db.createObjectStore('log', {autoIncrement: true});
            objStore.createIndex('id_idx', 'id', {unique: true});
        });
});

flow.controller('mainController', function ($scope) {

})

function makeid() {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}