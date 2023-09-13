// ==UserScript==
// @name         ServiceNow Suggested Group Button
// @version      1.7490
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

        const hasSpecialNote = lines.some(line => line.includes("Enabled") || line.includes("Essentials"));

        const checks = [
          // Checks are listed in order of priority to check
          {
            includesAny: ['VMware recommends not running on a snapshot for more than 24-72 hours', 'Zerto VPG '],
            priortxt: '',
            group: 'Check Client ID and route to Client Support POD\n or Windows Support in Remedy.'
          },
          {
            includesAny: ['errors-logged-esb', 'noc-alerts-prod ERROR', 'noc-escalations-prod ERROR', 'noc-itsm-sync-prod', 'noc-jobs-prod ERROR', 'appconsole-errors-esb', 'noc-jobs-daily-prod', 'lvs1esb'],
            priortxt: 'Suggested Group: ',
            group: 'Enterprise Service Bus'
          },
          {
            includesAny: ['host_name:mits', 'VMware VM Snapshots-MITS-', 'description: MITS-', 'description: MITS_', 'lmcollector: LVSMITS\\MITS'],
            priortxt: 'Suggested Group: ',
            group: 'NOC III'
          },
          {
            includesAny: ['lvs.igsteam:SOC', 'lmcollector: LVSSOC\\SOC-YYC1-MON01P'],
            priortxt: 'Suggested Group: ',
            group: 'Security Operations Center'
          },
          {
            includesAny: ['lvs.igsteam:Cloud', 'description: DS-System '],
            priortxt: 'Suggested Group: ',
            group: 'Cloud Platform'
          },
          {
            includesAny: ['FVOW10MGMT', 'BC Hydro' ],
            priortxt: 'Suggested Group: ',
            group: 'BC Hydro VOIP Support'
          },
          {
            includesAny: ['ATB' ],
            priortxt: 'Suggested Group: ',
            group: 'ATB  - Financial Network Support'
          },
          {
            includesAny: ['EPCOR' ],
            priortxt: 'Suggested Group: ',
            group: 'EPCOR Utilities Inc.<br /><b><u>When Paging Out</u>: be sure to e-mail Epcor Template to Telus Service Desk as per Esc Doc!</b>'
          },
          {
            includesAny: ['KEYERA' ],
            priortxt: '',
            group: 'E-mail/Call Client and Resolve.'
          },
          {
            includes: 'lvs.igsteam:Network',
            priortxt: 'Suggested Group: ',
            group: 'IGS POD NW',
            //requiresAny: ['IGS POD AB 1', 'LVSCALGARY', 'service_group: Ceres Terminals']
            requiresAny: ['LVSCALGARY', 'Ceres Terminals', 'Inter Pipeline', 'TraPac', 'Champion Petfoods', 'Parkland County', 'DCP']

          },
          {
            includes: 'LogicMonitor system has not received any data from Collector ',
            priortxt: '',
            group: 'Collector Down Alert, Assign to appropriate POD'
          },
          {
            includesAny: ['LVSCALGARY\\', 'Long View Systems Internal Systems'],
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
        let isMatchFound = false;

        outerLoop:
        for (const check of checks) {
            if (check.requiresAny) {
                const requiredLabels = check.requiresAny;
                const hasRequiredLabels = requiredLabels.some(label => lines.some(line => line.includes(label)));
                if (!hasRequiredLabels) {
                    continue;
                }
            }

            for (const line of lines) {
                let found = false;
                let foundValue = '';

                if (check.includes) {
                    found = line.includes(check.includes);
                    if (found) {
                        foundValue = check.includes;
                    }
                } else if (check.includesAny) {
                    for (const includeItem of check.includesAny) {
                        if (line.includes(includeItem)) {
                            found = true;
                            foundValue = includeItem;
                            break;
                        }
                    }
                }

                if (found) {
                    isMatchFound = true;
                    suggestedAssignmentGroupText = check.priortxt + '<b>' + check.group + '</b>';

                    // Check for lvs.pod and special note
                    if (foundValue === 'lvs.pod:' && check.group === '') {
                        const podValue = line.split('lvs.pod:')[1].trim();
                        if (podValue !== '') {
                            suggestedAssignmentGroupText += '<b>' + podValue + '</b>';

                            if (hasSpecialNote) {
                                suggestedAssignmentGroupText = 'Check for client specific runbook/escalation process for <b>Enabled</b> / <b>Essentials</b> devices before routing<br>' + suggestedAssignmentGroupText;
                            }
                        }
                    }

                    break outerLoop; // Break out of the outer loop when a match is found
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
