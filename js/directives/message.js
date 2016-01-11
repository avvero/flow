angular.module('flow').directive('message', function(utils) {
    return function($scope, element, attrs) {
        $scope.$watch(attrs.message,function(value){
            if ((value).indexOf('\n') != -1) {
                value = utils.fxPostProcess(value)
                if (value.split('\n').length > 1) {
                    // 1 ?????? ???? ? ???????? ???
                    value = value.split('\n')[0]
                }
            }
            element.text(value);
        });
    }
});