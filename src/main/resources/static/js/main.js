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
    }])
    .directive('onFinishRender', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('ngRepeatFinished');
                    });
                }
            }
        }
    })
    .directive('whenScrolledUp', ['$timeout', function($timeout) {
        return function(scope, elm, attr) {
            var raw = elm[0];

            $timeout(function() {
                raw.scrollTop = raw.scrollHeight;
            });

            elm.bind('scroll', function() {
                console.info("scrollTop "+raw.scrollTop)
                console.info("scrollHeight "+raw.scrollHeight)

                console.info("clientHeight "+raw.clientHeight)
                console.info("clientTop "+raw.clientTop)

                console.info("bottom "+ (raw.scrollHeight - raw.clientHeight - raw.scrollTop))
                if (raw.scrollTop < 100) { // load more items before you hit the top
                    var sh = raw.scrollHeight
                    scope.$apply(attr.whenScrolledUp);
                    raw.scrollTop = raw.scrollHeight - sh;
                    console.info("scrolled to top")
                }
                if ((raw.scrollHeight - raw.scrollTop) < 100) { // load more items before you hit the top
                    var sh = raw.scrollHeight
                    scope.$apply(attr.whenScrolledUp);
                    raw.scrollTop = raw.scrollHeight - sh;
                    console.info("scrolled to bottom")
                }
            });
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
        .connection('com.avvero.flow.log.' + makeid())
        .upgradeDatabase(1, function (event, db, tx) {
            var objStore = db.createObjectStore('log', {autoIncrement: true});
            objStore.createIndex('idx', 'idx', {unique: true});
            objStore.createIndex('level', 'level', {unique: false});
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