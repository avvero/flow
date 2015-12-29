angular.module('flow').directive('whenScrolledUp', ['$timeout', function ($timeout) {
    return function (scope, elm, attr) {
        var raw = elm[0];
        var lastScrollTop = raw.scrollTop

        $timeout(function () {
            raw.scrollTop = raw.scrollHeight;
        });

        elm.bind('scroll', function () {
            if (raw.scrollTop > lastScrollTop) { // load more items before you hit the top
                scope.$apply(attr.whenScrolledDown);
                //raw.scrollTop = raw.scrollHeight - raw.clientHeight
                console.debug('down')
            } else {
                scope.$apply(attr.whenScrolledUp);
                raw.scrollTop = 0
                console.debug('up')
            }
            lastScrollTop = raw.scrollTop
        });
    };
}])