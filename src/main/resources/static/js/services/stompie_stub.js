/**
 * Stubie
 *
 * Angular module for stompie emulation
 *
 */
angular.module('stompie', []).factory('$stompie', ['$rootScope', '$interval', '$http', function ($rootScope, $interval, $http) {
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
        $interval(function() {
            if (i < _data.length) {
                for (var j = 0; j < _subscriptions.length; j++) {
                    _subscriptions[j](_data[i])
                }
                i++;
            } else {
                i = 0;
            }
        }, 100);
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
