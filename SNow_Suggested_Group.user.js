// ==UserScript==
// @name         ServiceNow Suggested Group Button
// @version      1.741
// @description  Create a button with the suggested group text and copy it to the assignment group field when clicked
// @match        https://lvs1.service-now.com/incident*
// @downloadURL  https://github.com/ZVrTMzDkh4rptYWWf6/Tampermonkey-Scripts/raw/main/SNow_Suggested_Group.user.js
// @updateURL    https://github.com/ZVrTMzDkh4rptYWWf6/Tampermonkey-Scripts/raw/main/SNow_Suggested_Group.user.js
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    setTimeout(() => {
        const incidentDescription = document.getElementById('incident.description');
        const lines = incidentDescription.textContent.split('\n');
        const checks = [
          {
            includes: ['VMware recommends not running on a snapshot for more than 24-72 hours', 'Zerto VPG '],
            priortxt: '',
            group: 'Check Client ID and route to Client Support POD.\n or Windows Support in Remedy.'
          },
          {
            includes: 'LogicMonitor system has not received any data from Collector ',
            priortxt: '',
            group: 'Collector Down Alert, Assign to appropriate POD'
          },
          {
            includes: ['noc-alerts-prod ERROR ', 'noc-escalations-prod ERROR ', 'noc-itsm-sync-prod ERROR ', 'noc-jobs-prod ERROR ', 'appconsole-errors-esb '],
            priortxt: 'Suggested Group: ',
            group: 'Enterprise Service Bus'
          },
          {
            includes: ['host_name:mits', 'VMware VM Snapshots-MITS-', 'description: MITS-'],
            priortxt: 'Suggested Group: ',
            group: 'NOC III'
          },
          {
            includes: 'lvs.igsteam:Cloud',
            priortxt: 'Suggested Group: ',
            group: 'Cloud Platform'
          },
          {
            includes: 'lvs.igsteam:SOC',
            priortxt: 'Suggested Group: ',
            group: 'Security Operations Center'
          },
          {
            includes: 'lvs.igsteam:Network',
            priortxt: 'Suggested Group: ',
            group: 'IGS POD NW',
            requires: ['IGS POD AB 1', 'IGS POD AB 2', 'IGS POD TO 1', 'IGS POD BC 2', 'LVSCALGARY']
          },
          {
            includes: 'LVSCALGARY\\',
            priortxt: 'Suggested Group: ',
            group: 'IGS POD AB 1'
          },
          {
            includes: 'lvs.pod:',
            priortxt: 'Suggested Group: ',
            group: ''
          }
        ];
        let suggestedAssignmentGroupText = '';
        let isMatchFound = false; // Add this flag

        for (const check of checks) {
            let includesAll = true;
            if (check.requires) {
                const requiredLabels = check.requires;
                const hasRequiredLabels = requiredLabels.every(label => lines.some(line => line.includes(label)));
                if (!hasRequiredLabels) {
                    continue;
                }
            }
            for (const line of lines) {
                let found = false;
                if (Array.isArray(check.includes)) {
                    for (const includeItem of check.includes) {
                        if (line.includes(includeItem)) {
                            found = true;
                            break;
                        }
                    }
                } else {
                    found = line.includes(check.includes);
                }

                if (found) {
                    if (check.includes === 'lvs.pod:' && line.split('lvs.pod:')[1].trim() === '') {
                        continue; // Skip this line if 'lvs.pod:' is followed by an empty string
                    }

                    isMatchFound = true; // Set the flag to true when a match is found
                    suggestedAssignmentGroupText = check.priortxt + '<b>' + check.group + '</b>';

                    if (check.includes === 'lvs.pod:') {
                        if (line.split('lvs.pod:')[1].trim() === '') {
                            suggestedAssignmentGroupText += '<b>UNKNOWN</b>';
                        } else {
                            suggestedAssignmentGroupText += '<b>' + line.split('lvs.pod:')[1].trim() + '</b>';
                        }
                    }
                    break;
                }
            }
        }

        // Set the suggestedAssignmentGroupText to 'UNKNOWN' only if no match is found
        if (!isMatchFound) {
            suggestedAssignmentGroupText = 'Suggested Group: <b>UNKNOWN</b>';
        }

        const assignmentGroupInput = document.getElementById('sys_display.incident.assignment_group');
        const assignmentGroupDiv = assignmentGroupInput.closest('div');
        const suggestedGroupDiv = document.createElement('div');
        suggestedGroupDiv.innerHTML = suggestedAssignmentGroupText;
        assignmentGroupDiv.parentNode.insertBefore(suggestedGroupDiv, assignmentGroupDiv);

    }, 250);
})();
