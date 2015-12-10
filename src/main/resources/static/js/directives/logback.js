angular.module('flow').directive('logback', function() {
    return {
        templateUrl: '/views/logback.html'
    };
});
angular.module('flow').directive('message', function(utils) {
    return function($scope, element, attrs) {
        $scope.$watch(attrs.message,function(value){
            if ((value).indexOf('\n') != -1) {
                value = utils.fxPostProcess(value)
                if (value.split('\n').length > 1) {
                    // 1 строка идет в основной лог
                    value = value.split('\n')[0]
                }
            }
            element.text(value);
        });
    }
});
angular.module('flow').directive('messageMultiline', function(utils) {
    return function($scope, element, attrs) {
        $scope.$watch(attrs.messageMultiline,function(value){
            var isMultiline = false;
            if (value) {
                if (value.indexOf('\n') != -1) {
                    value = utils.fxPostProcess(value)
                    if (value.split('\n').length > 1) {
                        // 1 строка идет в основной лог
                        var firstLine = value.split('\n')[0]

                        var multiLineMessage = value.replace(firstLine + '\n', '')
                        multiLineMessage = vkbeautify.xml(multiLineMessage);
                        multiLineMessage = utils.safeTags(multiLineMessage);
                        multiLineMessage = multiLineMessage.replaceAll('\n', '<br/>')

                        isMultiline = true;
                        value = multiLineMessage;
                    }
                }
                if (isMultiline) {
                    element.html('<div class="log-msg-multiline bs-callout bs-callout-info">'+value+'</div>')
                }
            }
        });
    }
});
angular.module('flow').directive('cause', function() {
    var getCauses = function(causes, element){
        causes.push(element)
        if (element.cause) {
            return getCauses(causes, element.cause)
        } else {
            return causes
        }
    }
    return {
        scope: true,   // creates a new child scope
        link: function($scope, element, attrs, controllers) {
            $scope.$watch(attrs.cause,function(value){
                var causes = getCauses([], value)
                $scope.causes = causes
            });
        },
        templateUrl: '/views/cause.html'
    };
});