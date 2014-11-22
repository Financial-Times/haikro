'use strict';

require('es6-promise').polyfill();
require('isomorphic-fetch');

var assert = require("assert")
var denodeify = require('denodeify');
var exec = denodeify(require('child_process').exec, function(err, stdout, stderr) { return [err, stdout]; });

var logger = require('../lib/logger');
logger.setLevel('debug');

var create = require('../lib/create');
var destroy = require('../lib/destroy');

describe('create and destroy', function() {
	it('can create and delete an app', function(done) {
		this.timeout(60 * 1000);
		var app, token;
		// todo swap to default to environment variable
		exec('heroku auth:token')
			.then(function(result) {
				token = result;
				return create({ token: token });
			})
			.then(function(name) { app = name; })

			// HACK - Give Heroku a second or two to sort itself out
			.then(function() {
				return new Promise(function(resolve, reject) {
					setTimeout(resolve, 2000);
				});
			})
			.then(function() {
				return fetch('https://' + app + '.herokuapp.com/');
			})
			.then(function(response) {
				assert.equal(502, response.status);
				return response.text();
			})
			.then(function(body) {
				assert(/Welcome to your new app!/.test(body));
			})
			.then(function() {
				return destroy({
					token: token,
					app: app
				});
			})
			.then(function() { done(); })
			.catch(done);
	});
});
