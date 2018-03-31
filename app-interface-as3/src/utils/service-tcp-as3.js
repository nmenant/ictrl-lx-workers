/*
* This file contains the different function that will be used to
* deploy services through AS3
* here we have the following functions:
*     - Deploy a HTTP service
*/

// to allow connection to services that have self signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var DEBUG = true;
var logger = require('f5-logger').getInstance();

function createAS3TCPService() {

  this.createTCPAS3ServiceDefinition = function (appDetails) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("DEBUG: createAS3TCPService - function createTCPAS3ServiceDefinition");
        }
        var jsonPoolDataMembers = JSON.stringify(appDetails.members,' ','\t');
        var jsonPoolDataMonitors = JSON.stringify(appDetails.monitors,' ','\t');
        var AppDefinition = `,
        \"${appDetails.name}\": {
          \"class\": \"Application\",
          \"applicationType\": \"tcp\",
          \"vsMain\": {
            \"class\": \"VS_TCP\",
            \"virtualAddresses\": [
              \"${appDetails["service-ip"]}\"
            ],
            "virtualPort": ${appDetails["service-port"]},
            \"pool\": \"${appDetails.name}_pool\"
          },
          \"${appDetails.name}_pool\": {
            \"class\": \"Pool\",
            \"monitors\": ${jsonPoolDataMonitors},
            \"members\": ${jsonPoolDataMembers}
          }
        }`;
        logger.info("DEBUG: createAS3HTTPService - function createTCPAS3ServiceDefinition - App Definition: " + AppDefinition);
        resolve(AppDefinition);
      }
    )
  }

}

module.exports = createAS3TCPService;
