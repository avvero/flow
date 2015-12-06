angular.module('flow').filter('logComplex', function () {
    var isInMessage = function (log, logSearchValue){
        return log.formattedMessage.indexOf(logSearchValue) != -1
    }
    var isInThrowableInfo = function (log, logSearchValue){
        if (log.throwableProxy) {
            if ( log.throwableProxy.message && log.throwableProxy.message.indexOf(logSearchValue) != -1) {
                return true;
            }
            if (log.throwableProxy.stackTraceElementProxyArray && log.throwableProxy.stackTraceElementProxyArray.length) {
                for (var i =0; i < log.throwableProxy.stackTraceElementProxyArray.length; i++) {
                    if (log.throwableProxy.stackTraceElementProxyArray[i].steasString.indexOf(logSearchValue) != -1) {
                        return true;
                    }
                }
            }
            if (log.throwableProxy.cause) {
                if (log.throwableProxy.cause.message && log.throwableProxy.cause.message.indexOf(logSearchValue) != -1) {
                    return true;
                }
                if (log.throwableProxy.cause.stackTraceElementProxyArray && log.throwableProxy.cause.stackTraceElementProxyArray.length > 0) {
                    for (var i =0; i < log.throwableProxy.cause.stackTraceElementProxyArray.length; i++) {
                        if (log.throwableProxy.cause.stackTraceElementProxyArray[i].steasString.indexOf(logSearchValue) != -1) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    var isInLog = function (log, logSearchValue){
        var string = log.stringfied
        if (!log.stringfied) {
            log.stringfied = JSON.stringify(log)
            string = log.stringfied
        }
        return string.indexOf(logSearchValue) != -1
        //return isInMessage(log, logSearchValue)  || isInThrowableInfo(log, logSearchValue)
    }

    return function (logs, showTrace, showDebug, showInfo, showWarn, showError, limit, logSearchValue) {
        var result = []
        for (var i = logs.length - 1; i >= 0; i--) {
            if (limit == result.length) {
                break;
            }
            var log = logs[i]
            var level = log.level.levelStr
            // Level filter
            if (showTrace && level == 'TRACE'
                || showDebug && level == 'DEBUG'
                || showInfo && level == 'INFO'
                || showWarn && level == 'WARN'
                || showError && level == 'ERROR') {
                // Log message filter
                if (logSearchValue == '' || isInLog(log, logSearchValue)) {
                    result.push(logs[i])
                }
            }
        }
        return result;
    }
})