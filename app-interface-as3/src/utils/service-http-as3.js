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

function createAS3HTTPService() {

  this.createHTTPAS3ServiceDefinition = function (appDetails) {
    return new Promise (
      function (resolve, reject) {
        if (DEBUG) {
          logger.info("DEBUG: createAS3HTTPService - function createHTTPAS3ServiceDefinition");
        }
        var jsonPoolDataMembers = JSON.stringify(appDetails.members,' ','\t');
        var jsonPoolDataMonitors = JSON.stringify(appDetails.monitors,' ','\t');
        var AppDefinition = `,
        \"${appDetails.name}\": {
          \"class\": \"Application\",
          \"applicationType\": \"http\",
          \"vsMain\": {
            \"class\": \"VS_HTTP\",
            \"virtualAddresses\": [
              \"${appDetails["service-ip"]}\"
            ],
            \"pool\": \"${appDetails.name}_pool\",
            \"profileTCP\": { \"bigip\": \"/Common/tcp-wan-optimized\" }
          },
          \"${appDetails.name}_pool\": {
            \"class\": \"Pool\",
            \"monitors\": ${jsonPoolDataMonitors},
            \"members\": ${jsonPoolDataMembers}
          }
        }`;
        resolve(AppDefinition);
      }
    )
  }

}

module.exports = createAS3HTTPService;
