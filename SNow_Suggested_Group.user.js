// ==UserScript==
// @name         ServiceNow Suggested Group Button
// @version      1.7517
// @description  Create a button with the suggested group text and copy it to the assignment group field when clicked
// @match        https://lvs1.service-now.com/incident*
// @downloadURL  https://github.com/ZVrTMzDkh4rptYWWf6/Tampermonkey-Scripts/raw/main/SNow_Suggested_Group.user.js
// @updateURL    https://github.com/ZVrTMzDkh4rptYWWf6/Tampermonkey-Scripts/raw/main/SNow_Suggested_Group.user.js
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const debugMode = false; // Set to 'true' for console logs

    const checks = [
          // Checks are listed in order of priority to check
          {
            includesAny: ['VMware recommends not running on a snapshot for more than 24-72 hours', 'Zerto VPG '],
            priortxt: '',
            group: 'Check Client ID and route to Client Support POD<br />or Windows Support in Remedy.'
          },
          {
            includesAny: ['errors-logged-esb', 'noc-alerts-prod ERROR', 'noc-escalations-prod ERROR', 'noc-itsm-sync-prod', 'noc-jobs-prod ERROR', 'appconsole-errors-esb', 'noc-jobs-daily-prod', 'lvs1esb'],
            priortxt: 'Group Suggestion: ',
            group: 'Enterprise Service Bus'
          },
          {
            //includesAny: ['host_name:mits', 'VMware VM Snapshots-MITS-', 'description: MITS-', 'description: MITS_', 'lmcollector: LVSMITS\\MITS'],
            includesAny: ['host_name:mits', 'VMware VM Snapshots-MITS-', 'description: MITS-', 'description: MITS_'],
            priortxt: 'Group Suggestion: ',
            group: 'NOC III'
          },
          {
            includesAny: ['lvs.igsteam:SOC', 'lmcollector: LVSSOC\\SOC-YYC1-MON01P'],
            priortxt: 'Group Suggestion: ',
            group: 'Security Operations Center'
          },
          {
            includesAny: ['FVOW10MGMT', 'BC Hydro' ],
            priortxt: 'Group Suggestion: ',
            group: 'BC Hydro VOIP Support'
          },
          {
            includes: 'lvs.igsteam: Network',
            priortxt: 'Group Suggestion: ',
            group: 'IGS POD NW',
            //requiresAny: ['IGS POD AB 1', 'LVSCALGARY', 'service_group: Ceres Terminals']
            requiresAny: ['LVSCALGARY', 'Ceres Terminals', 'Inter Pipeline', 'TraPac', 'Champion Petfoods', 'Parkland County']
          },
          {
            includes: 'lvs.igsteam:Cloud',
            priortxt: 'Group Suggestion: ',
            group: 'Cloud Platform',
            requiresAny: ['lmcollector:ADMINS\\DC01-ADMSMON01', 'description: DS-System ']
          },
          {
            includesAny: ['LVSCALGARY\\', 'Long View Systems Internal Systems'],
            priortxt: 'Group Suggestion: ',
            group: 'IGS POD AB 1'
          },
          {
            includesAny: ['ATB' ],
            priortxt: 'Group Suggestion: ',
            group: 'ATB  - Financial Network Support'
          },
          {
            includesAny: ['EPCOR' ],
            priortxt: '<b><u><font color="red">When Paging Out</font></u>: be sure to e-mail EPCOR Template to Telus Service Desk as per Esc Doc!</b><br />Group Suggestion: ',
            group: 'EPCOR Utilities Inc. Support'
          },
          {
            includesAny: ['casalemedia.com', 'Index Exchange' ],
            priortxt: 'Group Suggestion: ',
            group: 'IGS POD TO 1'
          },
          {
            includesAny: ['KEYERA' ],
            priortxt: '',
            group: 'E-mail/Call Client and Resolve.'
          },
          {
            includesAny: ['Venturis Capital Corp', 'Venturis Capital' ],
            priortxt: 'Group Suggestion: ',
            group: 'IGS POD BC 1'
          },
          {
            includes: 'LogicMonitor system has not received any data from Collector ',
            priortxt: '',
            group: 'Collector Down Alert, Assign to appropriate POD'
          },
          {
            includes: 'lvs.pod:',
            priortxt: 'Group Suggestion: ',
            group: ''
          }
    ];

    function logDebug(...messages) {
        if (debugMode) {
            console.log(...messages);
        }
    }

    function checkDomainScope() {
        var domainAlert = document.getElementById('domain_alert');
        var toggleButton = document.querySelector('button[onclick*="onToggleDomainScope()"]');
        if (!domainAlert && toggleButton) {
            toggleButton.click();
            logDebug('Domain scope toggle button clicked.');
            showFloatingText();
        } else if (domainAlert) {
            logDebug('Domain scope already expanded.');
        } else {
            logDebug('Toggle Domain Scope button not found.');
        }
    }

    function addAnimationStyles() {
        var styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
            .floating-text {
                position: fixed;
                top: 5px; left: 90.5%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                opacity: 0;
                z-index: -1000;
                transition: opacity 1s;
            }
            @keyframes fadeInSlideDown { from { top: 0; opacity: 0; } to { top: 5px; opacity: 1; } }
            @keyframes fadeOutSlideDown { from { top: 5px; opacity: 1; } to { top: 15px; opacity: 0; } }
        `;
        document.head.appendChild(styleSheet);
    }

    function showFloatingText() {
        var floatingText = document.createElement('div');
        floatingText.innerHTML = 'Domain Scope\nToggled';
        floatingText.className = 'floating-text';
        document.body.appendChild(floatingText);

        floatingText.style.zIndex = 1000;
        floatingText.style.animation = 'fadeInSlideDown 1s forwards';

        setTimeout(() => {
            floatingText.style.animation = 'fadeOutSlideDown 1s forwards';
            setTimeout(() => floatingText.remove(), 1000);
        }, 4500);
    }


    function getincidentDescription() {
        var readonlyincidentDescription = document.getElementById('sys_readonly.incident.description');
        if (readonlyincidentDescription) {
            logDebug('incidentDescription from readonly input:', readonlyincidentDescription.value.trim()); // Debug log
            return readonlyincidentDescription;
        }

        var incidentDescription = document.getElementById('incident.description');
        if (incidentDescription) {
            logDebug('incidentDescription from editable input:', incidentDescription.value.trim()); // Debug log
            return incidentDescription;
        }

        logDebug('No incidentDescription found'); // Debug log
        return null;
    }

    function checkLineForMatch(line, check) {
        if (check.includes) {
            return line.includes(check.includes) ? check.includes : false;
        } else if (check.includesAny) {
            return check.includesAny.find(includeItem => line.includes(includeItem)) || false;
        }
        return false;
    }

    function countDeviceTypes(lines) {
        let count = { Enabled: 0, Essentials: 0, Empowered: 0 };

        lines.forEach(line => {
            if (line.includes("lvs.managedservicelevel: Enabled")) count.Enabled++;
            if (line.includes("lvs.managedservicelevel: Essentials")) count.Essentials++;
            if (line.includes("lvs.managedservicelevel: Empowered")) count.Empowered++;
        });

        return count;
    }

    function formatDeviceCount(count, type) {
        const deviceLabel = count === 1 ? 'device' : 'devices';
        const formattedType = type === "Enabled" || type === "Essentials"
        ? `<u><font color="red"><b>${count} ${type}</b></font> ${deviceLabel} detected in alert</u>`
        : `<b>${count} ${type}</b> ${deviceLabel} detected in alert`;
        return formattedType;
    }

    function processMatch(foundValue, check, line, lines) {
        let suggestedText = check.priortxt + '<b>' + check.group + '</b>';

        if (foundValue === 'lvs.pod:' && check.group === '') {
            const podValue = line.split('lvs.pod:')[1].trim();
            suggestedText += podValue ? `<b>${podValue}</b>` : '<b>UNKNOWN</b>';
        }

        const deviceCounts = countDeviceTypes(lines);
        const specialNotes = [];

        let enabledDetected = deviceCounts.Enabled > 0;
        let essentialsDetected = deviceCounts.Essentials > 0;

        Object.entries(deviceCounts).forEach(([type, count]) => {
            if (count > 0 && (type === "Enabled" || type === "Essentials")) {
                specialNotes.push(formatDeviceCount(count, type));
            } else if (count > 0 && type === "Empowered" && (enabledDetected || essentialsDetected)) {
                specialNotes.push(formatDeviceCount(count, type));
            }
        });

        if (specialNotes.length) {
            let specificDevices = [];
            if (enabledDetected) specificDevices.push("Enabled");
            if (essentialsDetected) specificDevices.push("Essentials");

            let devicesText = specificDevices.join('/');
            suggestedText = `${specialNotes.join('<br />')}<br />Check for client specific runbook/escalation process for any <font color="red">${devicesText}</font> devices before routing.<br />${suggestedText}`;
        }

        return suggestedText;
    }

    setTimeout(() => {
        addAnimationStyles();
        setTimeout(checkDomainScope, 250);

        var incidentDescription = getincidentDescription();
        const lines = incidentDescription.textContent.split('\n');

        let suggestedAssignmentGroupText = '';
        let isMatchFound = false;

        outerLoop:
        for (const check of checks) {
            if (check.requiresAny && !check.requiresAny.some(label => lines.some(line => line.includes(label)))) {
                continue;
            }

            for (const line of lines) {
                const foundValue = checkLineForMatch(line, check);
                if (foundValue) {
                    suggestedAssignmentGroupText = processMatch(foundValue, check, line, lines);
                    isMatchFound = true;
                    break outerLoop;
                }
            }
        }

        suggestedAssignmentGroupText = isMatchFound ? suggestedAssignmentGroupText : 'Suggested Group: <b>UNKNOWN</b>';
        const assignmentGroupDiv = document.getElementById('sys_display.incident.assignment_group').closest('div');
        const suggestedGroupDiv = document.createElement('div');
        suggestedGroupDiv.innerHTML = suggestedAssignmentGroupText;
        assignmentGroupDiv.parentNode.insertBefore(suggestedGroupDiv, assignmentGroupDiv);

    }, 250);

})();
