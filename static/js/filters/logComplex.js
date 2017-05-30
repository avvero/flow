angular.module('flow').filter('logComplex', function () {
    var filterCallCount = 0;
    var cacheFilter = true;
    var isInLog = function (log, logFilterValue) {
        var string = log.stringfied
        if (!log.stringfied) {
            log.stringfied = JSON.stringify(log)
            string = log.stringfied
        }
        return string.indexOf(logFilterValue) != -1
    }

    return function (logs, showTrace, showDebug, showInfo, showWarn, showError, caret, limit, logFilterValue) {
        var result = []
        var hash = '' + showTrace + showDebug + showInfo + showWarn + showError + limit + logFilterValue + logs.length
        if (hash != caret.hash) {
            caret.hash = hash
            caret.position = 0
            caret.tension = 0
        }
        //TODO Very very nasty code
        if (cacheFilter && caret.fullHash == (hash + ':' + caret.position + ':' + caret.tension)) {
            console.debug("Filter is skipped")
            return caret.result;
        }
        var toSkip = caret.position;
        for (var i = logs.length - 1; i >= 0; i--) {
            if (limit != -1 && limit == result.length) {
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
                if (logFilterValue == '' || isInLog(log, logFilterValue)) {
                    if (toSkip == 0) {
                        result.push(logs[i])
                    } else {
                        --toSkip
                    }
                }
            }
        }
        if (toSkip > 0) {
            caret.position = caret.position - toSkip
        }

        //TODO Very very nasty code
        if (cacheFilter) {
            caret.fullHash = caret.hash + ':' + caret.position + ':' + caret.tension
            caret.result = result
            console.debug("filter hash " + caret.fullHash)
        }
        console.debug("Filter is called " + ++filterCallCount + " times")
        return result;
    }
})