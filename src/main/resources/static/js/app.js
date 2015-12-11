angular.module("flow", [
    'ngRoute',
    'ui.router',
    'ngSanitize',
    'stompie',
    'ui.bootstrap',
    'LocalStorageModule',
    'chart.js'
])
angular.module("flow").constant('constants', {
    version: "1.0.0"
})
// configure our routes
angular.module("flow").config(function ($routeProvider, $stateProvider, $urlRouterProvider, constants, localStorageServiceProvider) {

    $urlRouterProvider.otherwise("/")

    $stateProvider
        .state('index', {
            url: "/",
            views: {
                "single": {
                    templateUrl: '/views/markers.html',
                    controller: markersController,
                    resolve: markersController.resolve
                }
            }
        })
        .state('flow', {
            url: "/flow/:marker",
            views: {
                "single": {
                    templateUrl: '/views/flow.html',
                    controller: flowController
                }
            }
        })
    localStorageServiceProvider
        .setPrefix('com.avvero.flow.' + constants.version)
        .setStorageType('localStorage')
})
angular.module("flow").run(function ($rootScope) {
    String.prototype.replaceAll = function( token, newToken, ignoreCase ) {
        var _token;
        var str = this + "";
        var i = -1;
        if ( typeof token === "string" ) {
            if ( ignoreCase ) {
                _token = token.toLowerCase();
                while( (
                    i = str.toLowerCase().indexOf(
                        token, i >= 0 ? i + newToken.length : 0
                    ) ) !== -1
                    ) {
                    str = str.substring( 0, i ) +
                        newToken +
                        str.substring( i + token.length );
                }
            } else {
                return this.split( token ).join( newToken );
            }
        }
        return str;
    };
})

angular.module("flow").controller('mainController', function ($scope) {

})