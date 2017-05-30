angular.module('flow').directive('multiline', function($sce) {
    return function($scope, element, attrs) {
        $scope.$watch(attrs.multiline,function(value){
            if (value) {
                if (value.split('\n').length > 1) {
                    element.html(value.replaceAll('\n\n', '<br/>').replaceAll('\n', '<br/>'));
                } else {
                    element.text(value);
                }
            }
        });
    }
});