angular.module('flow').filter('level', function () {
    return function (logs, showTrace, showDebug, showInfo, showWarn, showError, limit) {
        var result = []
        for (var i = 0; i < logs.length; i++) {
            if (limit == result.length) {
                break;
            }
            var level = logs[i].level.levelStr
            if (showTrace && level == 'TRACE'
                || showDebug && level == 'DEBUG'
                || showInfo && level == 'INFO'
                || showWarn && level == 'WARN'
                || showError && level == 'ERROR') {
                result.push(logs[i])
            }
        }
        return result;
    }
})