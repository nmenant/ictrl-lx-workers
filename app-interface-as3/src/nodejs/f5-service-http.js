/**
* This iControl LX extension will create a declarative REST my_interface
* to deploy services. In this example, we will use an IPAM solution called
* infoblox to retrieve the service external IP
*/

var logger = require('f5-logger').getInstance();
var AppInterfaceIPAMFunc = require("../utils/my-app-interface-ipam-utils.js");
var serviceHTTPAS3Func = require("../utils/service-http-as3-utils.js");
var DEBUG = true;
var WorkerName = "f5_service_http";

// specify whether you want infoblox to handle the VS IP or if it will be provided by the consumer
var useInfoblox = false;
// subnet is used with infoblox to specify in which subnet you need an IP
var subnet = "10.100.60.0/24";


function f5_service_http() {
}

//we define our worker path
f5_service_http.prototype.WORKER_URI_PATH = "/shared/workers/my-service-catalog/f5-service-http";

f5_service_http.prototype.isPublic = true;

// Enable worker URL routing as passthrough.
f5_service_http.prototype.isPassThrough = true;

//triggered when our worker is loaded
f5_service_http.prototype.onStart = function (success) {
  success();
};

/*
* Handle GET requests
*/
f5_service_http.prototype.onGet = function (restOperation) {
/*  var uriValue = restOperation.getUri();
  var serviceName = uriValue.path.toString().split("/")[4];
  var iWFServiceDefinition;
  var iWFConnectorName;

  athis = this;

  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onGet - uri is " + serviceName);
  }
  var IWFInterface = new AppInterfaceIWFFunc();
  IWFInterface.GetService(serviceName)
  .then (function (body) {
    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onGet - body is " + body);
    }
    iWFServiceDefinition = JSON.parse(body);

    var connectorId = iWFServiceDefinition.properties[0].value.toString().split("/");
    connectorId = connectorId[connectorId.length - 1];
    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onGet - GetService/connectorId is: " + connectorId);
    }
    return IWFInterface.GetConnectorName(connectorId);
  })
  .then (function (connectorName) {
    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onGet - connectorName is " + connectorName);
    }
    var templateName = iWFServiceDefinition.tenantTemplateReference.link.toString().split("/");
    templateName = templateName[templateName.length - 1];
    var varsList = iWFServiceDefinition.vars;
    var tablesList = iWFServiceDefinition.tables;
    //We have all the date to build the response to the get request
    var restBody = "{ \"name\": \"" + serviceName + "\", \"template\": \"" + templateName + "\",";

    if ( !useInfoblox ) {
      for (var k=0; k < varsList.length; k++) {
        if (varsList[k].name == "pool__addr") {
          restBody += "\"service-ip\": \"" + varsList[k].value + "\",";
        }
      }
    }
    restBody += "\"clustername\": \"" + connectorName + "\",\"app-data\": [";

    // reminder: var varsList  -> contains all the vars that were defined in our app definition
    for (var j=0; j < varsList.length; j++) {
      if (varsList[j].name != "pool__addr") {
        if (j > 0){
          restBody += ",";
        }
        composeBody(varsList[j]);
      }
    }
    function composeBody(message){
      restBody += " { \"name\" : \"" + message.name + "\", \"value\" : \"" + message.value + "\"}";
    }

    restBody += "], \"servers-data\": ";
    restBody += JSON.stringify(tablesList,' ','\t');

    //close our payload
    restBody += "}";
    if (DEBUG === true) {
      logger.info ("DEBUG: " + WorkerName + " onGet - response service BODY is: " + JSON.stringify(restBody,' ','\t'));
    }
    restOperation.setBody(restBody);
    athis.completeRestOperation(restOperation);
  })
  .catch (function (err) {
    logger.info("DEBUG: " + WorkerName + " - onGet, GetService - something went wrong: " + JSON.stringify(err));
    responseBody = "{ \"name\": \"" + serviceName + "\", \"value\": \"" + err + "\"}";
    restOperation.setBody(responseBody);
    restOperation.setStatusCode(400);
    athis.completeRestOperation(restOperation);
  });
  */
};

/*
* Handle POSTrequests
*/
f5_service_http.prototype.onPost = function(restOperation) {
  var newState = restOperation.getBody();
  var BIGIPIP = newState.clustername;
  var serviceName = newState.name;
  var tenantName = newState.tenant;
  var poolData = newState["app-data"];
  var serviceIP;


  if (DEBUG) {
    logger.info(WorkerName + " - onPost()");
  }

  athis = this;

  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onPost() - calling HTTP app interface worker with name: " + serviceName);
  }

  var serviceHTTPAS3Interface = new serviceHTTPAS3Func();

  if (useInfoblox) {
    var IPAMQuery = new AppInterfaceIPAMFunc(serviceName, subnet);
  } else {
    serviceIP = newState["service-ip"];

    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onPost, the service IP is: " + serviceIP);
    }
    serviceHTTPAS3Interface.DeployService(BIGIPIP, serviceName, tenantName, poolData, serviceIP)
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
  }
};

/*
* Handle PUT requests
*/
f5_service_http.prototype.onPut = function(restOperation) {
  var newState = restOperation.getBody();
  var serviceName = newState.name;
  var connectorName = newState.clustername;
  var vsIP;
  var athis = this;

  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onPut()");
  }

/*  var IWFInterface = new AppInterfaceIWFFunc();
  IWFInterface.GetServiceVSIP(serviceName)
  .then (function (myVSIP) {
    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onPut() - the VS IP for " + serviceName + " is: " + myVSIP);
    }
    vsIP = myVSIP;
    return IWFInterface.GetConnectorID(connectorName);
  })
  .then (function (connectorId) {
    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onPut() - the connector ID for " + connectorName + " is: " + connectorId);
    }
    return IWFInterface.UpdateService(vsIP, connectorId, newState);
  })
  .then (function () {
    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onPut() - Put request pushed on iWF");
    }
    restOperation.setBody(newState);
    athis.completeRestOperation(restOperation);
  })
  .catch (function (err) {
    logger.info("DEBUG: " + WorkerName + " - onPut, something went wrong: " + JSON.stringify(err));
    responseBody = "{ \"name\": \"" + serviceName + "\", \"value\": \"" + err + "\"}";
    restOperation.setBody(responseBody);
    restOperation.setStatusCode(400);
    athis.completeRestOperation(restOperation);
  });
  */
};

/*
* Handle PATCH requests
*/
f5_service_http.prototype.onPatch = function(restOperation) {
  var newState = restOperation.getBody();

  if (DEBUG) {
    logger.info(WorkerName + " - onPatch()");
  }
  this.completeRestOperation(restOperation);
};

/*
* Handle DELETE requests
*/
f5_service_http.prototype.onDelete = function(restOperation) {
  var uriValue = restOperation.getUri();
  var serviceName = uriValue.path.toString().split("/")[4];
  athis = this;

  if (DEBUG) {
    logger.info("DEBUG: " + WorkerName + " - onDelete - service to remove is: " + serviceName);
  }
/*
  var IPAMQuery = new AppInterfaceIPAMFunc(serviceName, subnet);
  var IWFInterface = new AppInterfaceIWFFunc();

  IWFInterface.DeleteService(serviceName)
  .then (function () {
    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onDelete - service has been removed from iWF");
    }
    if (useInfoblox) {
      return IPAMQuery.ReleaseIP(serviceName);
    }
  })
  .then (function () {
    if (DEBUG) {
      logger.info("DEBUG: " + WorkerName + " - onDelete - released IP from IPAM");
    }
    athis.completeRestOperation(restOperation);
  })
  .catch (function (err) {
    logger.info("DEBUG: " + WorkerName + " - onDelete, something went wrong: " + JSON.stringify(err));
    responseBody = "{ \"name\": \"" + serviceName + "\", \"value\": \"" + err + "\"}";
    restOperation.setBody(responseBody);
    restOperation.setStatusCode(400);
    athis.completeRestOperation(restOperation);
  });
  */
};
/**
* handle /example HTTP request
*/
f5_service_http.prototype.getExampleState = function () {

  if (useInfoblox) {
    return {
      "name": "my-app-name",
      "template": "f5-http-lb",
      "clustername": "BIG-IP-student",
      "app-data": [
        {
          "name": "pool__port",
          "value": "80"
        }
      ],
      "servers-data": [{
        "name": "pool__Members",
        "columns": [
          "IPAddress",
          "State"
        ],
        "rows": [
          [
            "10.1.10.10",
            "enabled"
          ], [
            "10.1.10.11",
            "enabled"
          ]
        ]
      }]
    };
  } else {
    return {
      "name": "my-app-name",
      "template": "f5-http-lb",
      "service-ip": "10.1.50.80",
      "clustername": "BIG-IP-student",
      "app-data": [
        {
          "name": "pool__port",
          "value": "80"
        }
      ],
      "servers-data": [{
        "name": "pool__Members",
        "columns": [
          "IPAddress",
          "State"
        ],
        "rows": [
          [
            "10.1.10.10",
            "enabled"
          ], [
            "10.1.10.11",
            "enabled"
          ]
        ]
      }]
    };
  }
};

module.exports = f5_service_http;
