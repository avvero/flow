/**
 * Stubie
 *
 * Angular module for stompie emulation
 *
 */
angular.module('stompie', []).factory('$stompie', ['$rootScope', '$timeout', '$http', function ($rootScope, $timeout, $http) {
    'use strict';

    var _stompie = {},
        _data = [],
        _subscriptions = [];

    _stompie.connected = false;

    _stompie._connect = function (endpoint, callback) {
    };

    _stompie.using = function (endpoint, callbacks) {
        $http({
            method: 'GET',
            url: 'demo/data/items',
            headers: {'Content-Type': 'application/json;charset=UTF-8'}
        })
            .success(function (data) {
                _data = data
                for (var i = 0; i < callbacks.length; i++) {
                    callbacks[i]()
                }
                _stompie.publish()
            })
    };

    _stompie.publish = function() {
        var i = 0;
        var d = 100
        var t = function () {
            if (i < _data.length) {
                for (var j = 0; j < _subscriptions.length; j++) {
                    _subscriptions[j](_data[i])
                }
                i++;
                $timeout(t, d)
            } else {
                d = d * 2
                i = 0;
                $timeout(t, d)
            }
        }
        $timeout(t, d)
    }

    _stompie.disconnect = function (callback) {
    };

    _stompie.subscribe = function (channel, callback) {
        _subscriptions.push(callback)
    };

    _stompie.send = function (queue, obj, priority) {
    };

    return _stompie;
}]);
