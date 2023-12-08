// ==UserScript==
// @name         ServiceNow Show Ticket Creator Email at top of Incident
// @version      1.491
// @description  Show the Name of the ticket creator, extracted from the last e-mail address,at the top of the ticket information section.
// @match        https://lvs1.service-now.com/incident*
// @downloadURL  https://github.com/ZVrTMzDkh4rptYWWf6/Tampermonkey-Scripts/raw/main/SNow_Show_Name_on_Ticket.user.js
// @updateURL    https://github.com/ZVrTMzDkh4rptYWWf6/Tampermonkey-Scripts/raw/main/SNow_Show_Name_on_Ticket.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function getEmailAddress() {
        var emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i;
        var createdByEmails = document.querySelectorAll('[id^="activity_"] .sn-widget-textblock-body');
        for (var i = createdByEmails.length - 1; i >= 0; i--) {
            var possibleEmailText = createdByEmails[i].textContent.trim();
            if (emailRegex.test(possibleEmailText)) {
                //console.log('Email from activity:', possibleEmailText); // Debug log
                return possibleEmailText.match(emailRegex)[0];
            }
        }

        var inputElement = document.getElementById('incident.sys_created_by');
        if (inputElement && emailRegex.test(inputElement.value)) {
            //console.log('Email from editable input:', inputElement.value.trim()); // Debug log
            return inputElement.value.trim();
        }

        var readonlyInputElement = document.getElementById('sys_readonly.incident.sys_created_by');
        if (readonlyInputElement && emailRegex.test(readonlyInputElement.value)) {
            //console.log('Email from readonly input:', readonlyInputElement.value.trim()); // Debug log
            return readonlyInputElement.value.trim();
        }

        //console.log('No valid email address found'); // Debug log
        return null;
    }

    function getNameFromEmail(email) {
        var emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
        if (emailRegex.test(email)) {
            var firstLast = email.split('@')[0];
            var firstName = firstLast.split('.')[0].charAt(0).toUpperCase() + firstLast.split('.')[0].slice(1);
            var lastName = firstLast.split('.')[1].charAt(0).toUpperCase() + firstLast.split('.')[1].slice(1);
            return { firstName: firstName, lastName: lastName };
        }

        return null;
    }

    function displayCreatorName(name) {
        if (name) {
            var creatorNameDisplay = document.createElement('div');
            creatorNameDisplay.innerHTML = 'Ticket Created by: </br><b>' + name.firstName + ' ' + name.lastName + '</b>';
            var labelNumber = document.getElementById('label.incident.number');
            if (labelNumber) {
                labelNumber.parentNode.insertBefore(creatorNameDisplay, labelNumber);
            }
        }
    }

    function updateTitleTemporarily(newTitle, originalTitle) {
        var interval = setInterval(function() {
            document.title = newTitle;
        }, 1000); // Update every second

        setTimeout(function() {
            clearInterval(interval);
            document.title = originalTitle;
        }, 20000); // Reset after 20 seconds
    }

    function displayErrorMessage() {
        var creatorNameDisplay = document.createElement('div');
        creatorNameDisplay.innerHTML = 'Ticket may have been manually created, or no name found where expected';
        var labelNumber = document.getElementById('label.incident.number');
        if (labelNumber) {
            labelNumber.parentNode.insertBefore(creatorNameDisplay, labelNumber);
        }
    }

    setTimeout(function() {
        var creatorEmailAddress = getEmailAddress();
        var originalTitle = document.title;
        var newTitle = null;

        if (creatorEmailAddress) {
            var name = getNameFromEmail(creatorEmailAddress);
            displayCreatorName(name);
            //newTitle = name.firstName + ' - ' + originalTitle;
            //updateTitleTemporarily(newTitle, originalTitle);
        } else {
            displayErrorMessage();
        }
    }, 250);

})();
