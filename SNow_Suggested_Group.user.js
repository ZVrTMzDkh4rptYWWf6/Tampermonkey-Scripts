// ==UserScript==
// @name         ServiceNow Suggested Group Button
// @version      1.7505
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

        // Delayed execution to ensure the 'Toggle Domain Scope' button is available
        setTimeout(() => {
            var domainAlert = document.getElementById('domain_alert');
            var toggleButton = document.querySelector('button[onclick*="onToggleDomainScope()"]');

            // Check if the domain scope alert is present and the toggle button exists
            if (!domainAlert && toggleButton) {
                try {
                    toggleButton.click();
                    console.log('Domain scope toggle button clicked.');
                } catch (error) {
                    console.error('Error while clicking toggle button:', error);
                }
            } else if (domainAlert) {
                console.log('Domain scope already expanded.');
            } else {
                console.error('Toggle Domain Scope button not found.');
            }
        }, 1000); // Adjust this delay as needed


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
                includesAny: ['FVOW10MGMT', 'BC Hydro' ],
                priortxt: 'Suggested Group: ',
                group: 'BC Hydro VOIP Support'
              },
              {
                includes: 'lvs.igsteam: Network',
                priortxt: 'Suggested Group: ',
                group: 'IGS POD NW',
                //requiresAny: ['IGS POD AB 1', 'LVSCALGARY', 'service_group: Ceres Terminals']
                requiresAny: ['LVSCALGARY', 'Ceres Terminals', 'Inter Pipeline', 'TraPac', 'Champion Petfoods', 'Parkland County']
              },
              {
                includes: 'lvs.igsteam:Cloud',
                priortxt: 'Suggested Group: ',
                group: 'Cloud Platform',
                requiresAny: ['lmcollector:ADMINS\\DC01-ADMSMON01', 'description: DS-System ']
              },
              {
                includesAny: ['LVSCALGARY\\', 'Long View Systems Internal Systems'],
                priortxt: 'Suggested Group: ',
                group: 'IGS POD AB 1'
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
                includesAny: ['casalemedia.com', 'Index Exchange' ],
                priortxt: 'Suggested Group: ',
                group: 'IGS POD TO 1'
              },
              {
                includesAny: ['KEYERA' ],
                priortxt: '',
                group: 'E-mail/Call Client and Resolve.'
              },
              {
                includesAny: ['Venturis Capital Corp', 'Venturis Capital' ],
                priortxt: 'Suggested Group: ',
                group: 'IGS POD BC 1'
              },
              {
                includes: 'LogicMonitor system has not received any data from Collector ',
                priortxt: '',
                group: 'Collector Down Alert, Assign to appropriate POD'
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
            console.log("Current Check:", check); // Log current check
            if (check.requiresAny) {
                const requiredLabels = check.requiresAny;
                const hasRequiredLabels = requiredLabels.some(label => lines.some(line => line.includes(label)));
                if (!hasRequiredLabels) {
                    console.log("Skipped Check due to missing required labels:", requiredLabels); // Log reason for skipping
                    continue;
                } else {
                    console.log("Required labels found for check:", check, "Labels:", requiredLabels); // Add this log
                }
            }

            for (const line of lines) {
                let found = false;
                let foundValue = '';

                if (check.includes) {
                    found = line.includes(check.includes);
                    if (found) {
                        foundValue = check.includes;
                        console.log("Line matched for includes:", line, "Value:", check.includes); // Add this log
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
                    console.log("Match Found on Line:", line, "Using Value:", foundValue); // Log the matched line and value
                    isMatchFound = true;
                    suggestedAssignmentGroupText = check.priortxt + '<b>' + check.group + '</b>';

                    // Check for lvs.pod and special note
                    if (foundValue === 'lvs.pod:' && check.group === '') {
                        const podValue = line.split('lvs.pod:')[1].trim();
                        console.log("Pod value found:", podValue); // Log the extracted pod value

                        if (podValue !== '') {
                            suggestedAssignmentGroupText += '<b>' + podValue + '</b>';
                            console.log("Pod Assignment Text Set:", suggestedAssignmentGroupText); // Log the constructed text

                        } else {
                            console.log("Empty pod value. Setting default text."); // Log when podValue is empty
                            suggestedAssignmentGroupText = 'Suggested Group: <b>UNKNOWN</b>'; // or any default text you want
                        }

                        if (hasSpecialNote) {
                            suggestedAssignmentGroupText = '<b>Enabled</b> / <b>Essentials</b> device(s) detected.<br />Check for client specific runbook/escalation process before routing.<br />' + suggestedAssignmentGroupText;
                            console.log("Special Note Added:", suggestedAssignmentGroupText); // Log the final text
                        }

                    }

                    break outerLoop; // Break out of the outer loop when a match is found
                }
            }
        }

        // Set the suggestedAssignmentGroupText to 'UNKNOWN' only if no match is found
        if (!isMatchFound && !suggestedAssignmentGroupText) { // Check if suggestedAssignmentGroupText is still empty
            console.log("No match found. Setting to UNKNOWN."); // Log when no matches are found
            suggestedAssignmentGroupText = 'Suggested Group: <b>UNKNOWN</b>';

            if (hasSpecialNote) {
                suggestedAssignmentGroupText = '<b>Enabled</b> / <b>Essentials</b> device(s) detected.<br />Check for client specific runbook/escalation process before routing.<br />' + suggestedAssignmentGroupText;
            }

        }


        const assignmentGroupInput = document.getElementById('sys_display.incident.assignment_group');
        const assignmentGroupDiv = assignmentGroupInput.closest('div');
        const suggestedGroupDiv = document.createElement('div');
        suggestedGroupDiv.innerHTML = suggestedAssignmentGroupText;
        assignmentGroupDiv.parentNode.insertBefore(suggestedGroupDiv, assignmentGroupDiv);

    }, 250);

})();
