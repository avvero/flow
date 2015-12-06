angular.module('flow').directive('multiline', function() {
    return function($scope, element, attrs) {
        $scope.$watch(attrs.multiline,function(value){
            if (value.split('\n').length > 1) {
                element.text(value.replaceAll('\n', '<br/>'));
            } else {
                element.text(value);
            }
        });
    }
});