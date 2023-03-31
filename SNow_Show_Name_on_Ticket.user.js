// ==UserScript==
// @name         ServiceNow Show Ticket Creator Email at top of Incident
// @version      1.48
// @description  Show the Name of the ticket creator, extracted from the last e-mail address,at the top of the ticket information section.
// @match        https://lvs1.service-now.com/incident*
// @downloadURL  https://github.com/ZVrTMzDkh4rptYWWf6/Tampermonkey-Scripts/raw/main/SNow_Show_Name_on_Ticket.user.js
// @updateURL    https://github.com/ZVrTMzDkh4rptYWWf6/Tampermonkey-Scripts/raw/main/SNow_Show_Name_on_Ticket.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setTimeout(function() {
        var creatorEmailAddress = null;
        var emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

        var createdByText = document.querySelector('.sn-card-component-createdby');
        var createdByEmails = document.querySelectorAll('[id^="activity_"] .sn-widget-textblock-body');
        var lastEmail = null;

        if (createdByEmails.length > 0) {
            lastEmail = createdByEmails[createdByEmails.length-1];
            creatorEmailAddress = lastEmail.textContent.trim();
        }

        if (creatorEmailAddress && emailRegex.test(creatorEmailAddress)) {
            var firstLast = creatorEmailAddress.split('@')[0];
            var creatorFirstName = firstLast.split('.')[0].charAt(0).toUpperCase() + firstLast.split('.')[0].slice(1);
            var creatorLastName = firstLast.split('.')[1].charAt(0).toUpperCase() + firstLast.split('.')[1].slice(1);
            var creatorNameDisplay = document.createElement('div');
            creatorNameDisplay.innerHTML = 'Ticket Created by: </br><b>' + creatorFirstName + ' ' + creatorLastName + '</b>';
            var labelNumber = document.getElementById('label.incident.number');
            labelNumber.parentNode.insertBefore(creatorNameDisplay, labelNumber);

            // Update the page title
            var originalTitle = document.title;
            document.title = creatorFirstName + ': ' + document.title;

            // Remove the name from the title after 25 seconds
            setTimeout(function() {
                document.title = originalTitle;
            }, 25000);
        } else {
            var creatorEmailDisplay = document.createElement('div');
            creatorEmailDisplay.innerHTML = 'Ticket may have been manually created, or no email found where expected';
            var labelNumber = document.getElementById('label.incident.number');
            labelNumber.parentNode.insertBefore(creatorEmailDisplay, labelNumber);
        }
    }, 1500);
})();
