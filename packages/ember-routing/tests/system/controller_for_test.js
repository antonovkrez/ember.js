import Ember from 'ember-metal/core'; // A
import { get } from 'ember-metal/property_get';
import run from 'ember-metal/run_loop';
import Namespace from 'ember-runtime/system/namespace';
import { classify } from 'ember-runtime/system/string';
import Controller from 'ember-runtime/controllers/controller';
import controllerFor from 'ember-routing/system/controller_for';
import generateController from 'ember-routing/system/generate_controller';
import {
  generateControllerFactory
} from 'ember-routing/system/generate_controller';
import { buildOwner } from 'internal-test-helpers';

function buildInstance(namespace) {
  let owner = buildOwner();

  owner.__registry__.resolver = resolverFor(namespace);
  owner.registerOptionsForType('view', { singleton: false });

  owner.register('application:main', namespace, { instantiate: false });

  owner.register('controller:basic', Controller, { instantiate: false });

  return owner;
}

function resolverFor(namespace) {
  return {
    resolve(fullName) {
      let nameParts = fullName.split(':');
      let type = nameParts[0];
      let name = nameParts[1];

      if (name === 'basic') {
        name = '';
      }
      let className = classify(name) + classify(type);
      let factory = get(namespace, className);

      if (factory) { return factory; }
    }
  };
}

let appInstance, appController, namespace;

QUnit.module('Ember.controllerFor', {
  setup() {
    namespace = Namespace.create();
    appInstance = buildInstance(namespace);
    appInstance.register('controller:app', Controller.extend());
    appController = appInstance.lookup('controller:app');
  },
  teardown() {
    run(() => {
      appInstance.destroy();
      namespace.destroy();
    });
  }
});

QUnit.test('controllerFor should lookup for registered controllers', function() {
  let controller = controllerFor(appInstance, 'app');

  equal(appController, controller, 'should find app controller');
});

QUnit.module('Ember.generateController', {
  setup() {
    namespace = Namespace.create();
    appInstance = buildInstance(namespace);
  },
  teardown() {
    run(() => {
      appInstance.destroy();
      namespace.destroy();
    });
  }
});

QUnit.test('generateController and generateControllerFactory are properties on the root namespace', function() {
  equal(Ember.generateController, generateController, 'should export generateController');
  equal(Ember.generateControllerFactory, generateControllerFactory, 'should export generateControllerFactory');
});

QUnit.test('generateController should create Ember.Controller', function() {
  let controller = generateController(appInstance, 'home');

  ok(controller instanceof Controller, 'should create controller');
});


QUnit.test('generateController should create App.Controller if provided', function() {
  let controller;
  namespace.Controller = Controller.extend();

  controller = generateController(appInstance, 'home');

  ok(controller instanceof namespace.Controller, 'should create controller');
});
