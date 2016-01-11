angular.module('flow').directive('logback', ['$timeout', function ($timeout) {
    return {
        link: function($scope, element, attrs) {
            $scope.$watch(attrs.onClick, function(value){
                $scope.onClick = value
            });
        },
        templateUrl: 'views/logback.html'
    };
}])