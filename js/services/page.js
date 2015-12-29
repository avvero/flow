angular.module('flow').factory('page', function () {
    var title = 'Flow';
    return {
        title: function () {
            return title;
        },
        setTitle: function (newTitle) {
            title = newTitle
        }
    };
});