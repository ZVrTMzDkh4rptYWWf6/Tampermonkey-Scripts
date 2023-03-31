// ==UserScript==
// @name         ServiceNow Recommended Group Button
// @version      1.74
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
            prior: '',
            group: 'Check Client ID and route to Client Support POD.\n or Windows Support in Remedy.'
          },
          {
            includes: 'LogicMonitor system has not received any data from Collector ',
            prior: '',
            group: 'Collector Down Alert, Assign to appropriate POD'
          },
          {
            includes: ['noc-alerts-prod ERROR ', 'noc-escalations-prod ERROR ', 'noc-itsm-sync-prod ERROR ', 'noc-jobs-prod ERROR ', 'appconsole-errors-esb '],
            prior: 'Recommended Group: ',
            group: 'Enterprise Service Bus'
          },
          {
            includes: ['host_name:mits', 'VMware VM Snapshots-MITS-', 'description: MITS-'],
            prior: 'Recommended Group: ',
            group: 'NOC III'
          },
          {
            includes: 'lvs.igsteam:Cloud',
            prior: 'Recommended Group: ',
            group: 'Cloud Platform'
          },
          {
            includes: 'lvs.igsteam:SOC',
            prior: 'Recommended Group: ',
            group: 'Security Operations Center'
          },
          {
            includes: 'lvs.igsteam:Network',
            prior: 'Recommended Group: ',
            group: 'IGS POD NW',
            requires: ['IGS POD AB 1', 'IGS POD AB 2', 'IGS POD TO 1', 'IGS POD BC 2', 'LVSCALGARY']
          },
          {
            includes: 'LVSCALGARY\\',
            prior: 'Recommended Group: ',
            group: 'IGS POD AB 1'
          },
          {
            includes: 'lvs.pod:',
            prior: 'Recommended Group: ',
            group: ''
          }
        ];
        let recommendedAssignmentGroupText = '';
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
                    recommendedAssignmentGroupText = check.prior + '<b>' + check.group + '</b>';

                    if (check.includes === 'lvs.pod:') {
                        if (line.split('lvs.pod:')[1].trim() === '') {
                            recommendedAssignmentGroupText += '<b>UNKNOWN</b>';
                        } else {
                            recommendedAssignmentGroupText += '<b>' + line.split('lvs.pod:')[1].trim() + '</b>';
                        }
                    }
                    break;
                }
            }
        }

        // Set the recommendedAssignmentGroupText to 'UNKNOWN' only if no match is found
        if (!isMatchFound) {
            recommendedAssignmentGroupText = 'Recommended Group: <b>UNKNOWN</b>';
        }

        const assignmentGroupInput = document.getElementById('sys_display.incident.assignment_group');
        const assignmentGroupDiv = assignmentGroupInput.closest('div');
        const recommendedGroupDiv = document.createElement('div');
        recommendedGroupDiv.innerHTML = recommendedAssignmentGroupText;
        assignmentGroupDiv.parentNode.insertBefore(recommendedGroupDiv, assignmentGroupDiv);

    }, 250);
})();
