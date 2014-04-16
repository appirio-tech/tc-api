/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*jslint newcap: true */

var http = require('http');
var request = require('request');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var url = require('url');

/**
 * This is the endpoint of the actionhero action for Docusign Callback 
 */
var API_ENDPOINT = process.env.DOCUSIGN_CALLBACK_ENDPOINT || 'http://localhost:8080/v2/terms/docusignCallback';

/**
 * Creates the options object used for making an HTTP request.
 * Sets the HTTP method, url, body and the Docusign Authorization header
 * @param <String> url The url to set for the HTTP request
 * @param <String> method The verb to set for the HTTP request
 * @param <String> body The body to set for the HTTP request in case method is POST. It must be a String not an Object.
 * @return options the options object for the HTTP request
 */
function initializeRequest(url, method, body) {
    var options = {
        "method": method,
        "uri": url,
        "body": body,
        "headers": {
            "Content-Type": "application/json"
        }
    };
    return options;
}

/**
 * The standalone pure node.js listener that listens to incoming Docusign Connect xml messages
 * It read the xml message, parses the appropriate content, and makes an equivalent POST in JSON to the actionhero docusign callback action
 * It then forwards the received response back to Docusign Connect. So in a way it is very much like a proxy.
 * @param Function The function that handles the request and response
 */
var server = http.createServer(function (req, resp) {
    // Read the XML, convert it into a normal POST request with body and call the docusignCallback action
    var body = '';
    req.on('data', function (chunk) {
        body += chunk.toString();
    });

    req.on('end', function () {
        var doc = new dom().parseFromString(body),
            statusNode = xpath.select('/DocuSignEnvelopeInformation/EnvelopeStatus/Status', doc),
            envelopeNode = xpath.select('/DocuSignEnvelopeInformation/EnvelopeStatus/EnvelopeID', doc),
            connectKey = url.parse(req.url, true).query.connectKey,
            tabStatusNodes = doc.getElementsByTagName('TabStatus'),
            envelopeStatus,
            envelopeId,
            tabs = [],
            x,
            tabLabelNode,
            tabValueNode,
            options;

        // Even if status or id is not found, we will call the API with non-trimmed empty string (actionhero rejects a completely empty string)
        // This is because we need to log the error as per the current codebase
        envelopeStatus = statusNode.length === 0 ? ' ' : statusNode[0].firstChild.data;
        envelopeId = envelopeNode.length === 0 ? ' ' : envelopeNode[0].firstChild.data;

        for (x = 0; x < tabStatusNodes.length; x += 1) {
            tabLabelNode = tabStatusNodes[x].getElementsByTagName('TabLabel')[0];
            tabValueNode = tabStatusNodes[x].getElementsByTagName('TabValue')[0];
            tabs.push({
                tabLabel: tabLabelNode.hasChildNodes() ? tabLabelNode.firstChild.data : '',
                tabValue: tabValueNode.hasChildNodes() ? tabValueNode.firstChild.data : ''
            });
        }

        //Now make call to our actionhero docusign callback action
        options = initializeRequest(API_ENDPOINT, 'POST', JSON.stringify({
            envelopeStatus: envelopeStatus,
            envelopeId: envelopeId,
            tabs: tabs,
            connectKey: connectKey
        }));
        request(options, function (err, res, body) {
            var statusCode, message, jsonRes = body ? JSON.parse(body) : {};

            if (err) {
                //This can happen only in case of unexpected error such as unable to connect to docusign callback action
                statusCode = 500;
                message = 'Unable to handle docusign callback. Please try later.';
            } else {
                statusCode = res.statusCode;
                message = jsonRes.message || '';
            }
            resp.writeHead(statusCode, {'Content-Type': 'text/plain'});
            resp.end(message);
        });
    });
});

server.listen(process.env.PORT || 8081);
