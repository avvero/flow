angular.module('flow').directive('messageMultiline', function(utils) {
    return function($scope, element, attrs) {
        $scope.$watch(attrs.messageMultiline,function(value){
            var isMultiline = false;
            if (value) {
                if (value.indexOf('\n') != -1) {
                    value = utils.fxPostProcess(value)
                    if (value.split('\n').length > 1) {
                        // 1 ?????? ???? ? ???????? ???
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
                    element.html('<div class="log-msg-multiline callout callout-info">'+value+'</div>')
                }
            }
        });
    }
});