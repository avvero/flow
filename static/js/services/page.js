angular.module('flow').factory('page', function () {
    var title = 'Flow2';
    return {
        title: function () {
            return title;
        },
        setTitle: function (newTitle) {
            title = newTitle
        }
    };
});