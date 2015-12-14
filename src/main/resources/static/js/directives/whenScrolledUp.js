angular.module('flow').directive('whenScrolledUp', ['$timeout', function ($timeout) {
    return function (scope, elm, attr) {
        var raw = elm[0];

        $timeout(function () {
            raw.scrollTop = raw.scrollHeight;
        });

        elm.bind('scroll', function () {
            if (raw.scrollTop < 20) { // load more items before you hit the top
                scope.$apply(attr.whenScrolledUp);
            }
            if ((raw.scrollHeight - raw.clientHeight - raw.scrollTop) < 20) { // load more items before you hit the top
                scope.$apply(attr.whenScrolledDown);
            }
        });
    };
}])