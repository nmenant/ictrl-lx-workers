/**
* This iControl LX extension will create a declarative REST API
* to deploy HTTP services. In this example, we will use an IPAM solution called
* infoblox to retrieve the service external IP as an option
*/

var logger = require('f5-logger').getInstance();
var AppInterfaceIPAMFunc = require("../utils/my-app-interface-ipam-utils.js");
var serviceAS3Func = require("../utils/services-as3-utils.js");
var DEBUG = true;
var WorkerName = "my_service_catalog";
// specify whether you want infoblox to handle the VS IP or if it will be provided by the consumer
var useInfoblox = false;

function my_service_catalog() {
}

//we define our worker path
my_service_catalog.prototype.WORKER_URI_PATH = "/shared/workers/my_service_catalog";

my_service_catalog.prototype.isPublic = true;

// Enable worker URL routing as passthrough.
my_service_catalog.prototype.isPassThrough = true;

//triggered when our worker is loaded
my_service_catalog.prototype.onStart = function (success) {
  success();
};

/*
* Handle GET requests
*/
my_service_catalog.prototype.onGet = function (restOperation) {

};

/*
* Handle POSTrequests
*/
my_service_catalog.prototype.onPost = function(restOperation) {
  var newState = restOperation.getBody();
  /*  var BIGIPIP = newState.clustername;
  var serviceName = newState.name;
  var tenantName = newState.tenant;
  var poolData = newState["app-data"];
  var serviceIP;
  */

  if (DEBUG) {
    logger.info(WorkerName + " - onPost()");
  }

  athis = this;

  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onPost() - calling app interface worker");
  }

  var serviceAS3Interface = new serviceAS3Func();

  serviceAS3Interface.DeployService(newState)
  .then (function() {
    athis.completeRestOperation(restOperation);
  })
  .catch (function (err) {
    logger.info("DEBUG: " + WorkerName + " - onPost, CreateService - something went wrong: " + JSON.stringify(err));
    responseBody = "{ \"name\": \"" + serviceName + "\", \"value\": \"" + err + "\"}";
    restOperation.setBody(responseBody);
    restOperation.setStatusCode(400);
    athis.completeRestOperation(restOperation);
  });
};

/*
* Handle PUT requests
*/
my_service_catalog.prototype.onPut = function(restOperation) {

};

/*
* Handle PATCH requests
*/
my_service_catalog.prototype.onPatch = function(restOperation) {
  var newState = restOperation.getBody();

  if (DEBUG) {
    logger.info(WorkerName + " - onPatch()");
  }
  this.completeRestOperation(restOperation);
};

/*
* Handle DELETE requests
*/
my_service_catalog.prototype.onDelete = function(restOperation) {

};
/**
* handle /example HTTP request
*/
my_service_catalog.prototype.getExampleState = function () {

  if (useInfoblox) {
    return {
      "name": "my_http_service",
      "clustername": "localhost",
      "tenant" : "tenant_Nicolas",
      "app-data": {
        "monitors": [
          "http"
        ],
        "members": [
          {
            "servicePort": 80,
            "serverAddresses": [
              "192.0.1.10",
              "192.0.1.11"
            ]
          }
        ]
      }
    };
  } else {
    return {
      "id": "my-transaction-id123",
      "clustername": "localhost",
      "tenant" : "tenant-Pepsi",
      "app-data": [
        {
          "name": "my_service_web",
          "service-template": "web-service",
          "service-ip": "10.0.1.80",
          "monitors": [
            "http"
          ],
          "members": [
            {
              "servicePort": 80,
              "serverAddresses": [
                "10.0.2.21",
                "10.0.2.22"
              ]
            }
          ]
        }
      ]
    };
  }
};

module.exports = my_service_catalog;
