angular.module('flow').directive('logDateTime', function() {
    return function($scope, element, attrs) {
        $scope.$watch(attrs.logDateTime,function(value){
            var date = moment(new Date(value)).format("YYYY-MM-DD HH:mm:ss")
            element.text(date);
        });
    }
});