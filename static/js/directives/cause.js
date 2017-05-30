angular.module('flow').directive('cause', function() {
    var getCauses = function(causes, element){
        causes.push(element)
        if (element.cause) {
            return getCauses(causes, element.cause)
        } else {
            return causes
        }
    }
    return {
        scope: true,   // creates a new child scope
        link: function($scope, element, attrs, controllers) {
            $scope.$watch(attrs.cause,function(value){
                var causes = getCauses([], value)
                $scope.causes = causes
            });
        },
        templateUrl: 'views/cause.html'
    };
});