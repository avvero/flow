angular.module('flow').service('utils', function () {
    return {
        safeTags: function (str) {
            return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll(' ', '&nbsp;');
        },
        pushToArray: function (array, value, limit) {
            while (array.length >= limit) {
                array.shift()
            }
            array.push(value)
        },
        fxPostProcess: function (text) {
            return text
                .replaceAll("******* ******** ********** *******", '')
                .replaceAll("----------------------------", '')
                .replaceAll("---------------------------", '')
                .replaceAll("-----------", '')
                .replaceAll("----------", '')
                .replaceAll("******* ********", '')
                .replaceAll("********** *******", '')
                .replaceAll("*******", '')
        }
    }
})