angular.module('flow').filter('reverse', function () {
    return function (items) {
        return items.slice().reverse();
    };
})