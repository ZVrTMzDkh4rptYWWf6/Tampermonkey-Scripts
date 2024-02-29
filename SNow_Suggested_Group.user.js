// ==UserScript==
// @name         ServiceNow Suggested Group Button
// @version      1.7604
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
              // VMWare Snapshots
              includesAny: ['VMware recommends not running on a snapshot for more than 24-72 hours', 'Zerto VPG '],
              priortxt: '',
              group: 'Check Client ID and route to Client Support POD<br />or Windows Support in Remedy.'
          },
          {
              // Enterprise Service Bus
              includesAny: ['errors-logged-esb', 'noc-alerts-prod ERROR', 'noc-escalations-prod ERROR', 'noc-itsm-sync-prod', 'noc-jobs-prod ERROR', 'appconsole-errors-esb', 'noc-jobs-daily-prod', 'lvs1esb'],
              priortxt: '',
              group: 'Enterprise Service Bus'
          },
          {
              // MITS Devices
              //includesAny: ['host_name:mits', 'VMware VM Snapshots-MITS-', 'description: MITS-', 'description: MITS_', 'lmcollector: LVSMITS\\MITS'],
              includesAny: ['host_name:mits', 'VMware VM Snapshots-MITS-', 'description: MITS-', 'description: MITS_'],
              priortxt: '',
              group: 'NOC III'
          },
          {
              // Security Operations Center
              includesAny: ['lvs.igsteam:SOC', 'lmcollector: LVSSOC\\SOC-YYC1-MON01P'],
              priortxt: '',
              group: 'Security Operations Center'
          },
          {
              // BC Hydro
              includesAny: ['FVOW10MGMT', 'BC Hydro' ],
              priortxt: '',
              group: 'BC Hydro VOIP Support'
          },
          {
              // ITO 'Network Voice' Tickets stay with IGS POD AB 1, don't send to IGS POD NW
              includes: 'lvs.igsteam: Network Voice',
              priortxt: '',
              group: 'IGS POD AB 1',
              requiresAny: ['LVSCALGARY']
          },
          {
              // Network Tickets for the 'requiresAny' Clients all go to IGS POD NW
              includes: 'lvs.igsteam: Network',
              priortxt: '',
              group: 'IGS POD NW',
              requiresAny: ['LVSCALGARY', 'Ceres Terminals', 'Inter Pipeline', 'TraPac', 'Champion Petfoods', 'Parkland County']
          },
          {
              // Cloud Platform Devices
              includes: 'lvs.igsteam:Cloud',
              priortxt: '',
              group: 'Cloud Platform',
              requiresAny: ['lmcollector:ADMINS\\DC01-ADMSMON01', 'description: DS-System ']
          },
          {
              // ITO Tickets go to IGS POD AB 1
              includesAny: ['LVSCALGARY\\', 'Long View Systems Internal Systems'],
              priortxt: '',
              group: 'IGS POD AB 1'
          },
          {
              // ATB goes to ATB  - Financial Network Support
              includesAny: ['ATB' ],
              priortxt: '',
              group: 'ATB  - Financial Network Support'
          },
          {
              // Bayshore, No IGS Support
              includesAny: ['BAYSHORE' ],
              priortxt: '',
              group: 'For Critical Alerts: E-mail and Call Client then Resolve.<br /><br />(Assign to <b>Bayshore Home Health Support</b> and save to have SNow send email.<br />After confirming email sent via Notes under ticket details, Resolve.)'
          },
          {
              // EPCOR goes to EPCOR Utilities Inc. Support
              includesAny: ['EPCOR' ],
              priortxt: '<b><u><font color="red">When Paging Out</font></u></b>: be sure to e-mail EPCOR Template to Telus Service Desk as per Esc Doc!<br />',
              group: 'EPCOR Utilities Inc. Support'
          },
          {
              // Anschutz SQL Tickets always go to IGS POD US 1
              includes: ['Anschutz' ],
              priortxt: '<b>Assign to POD to review SQL related alerts regardless of Enabled/Essentials status.</b><br/>',
              group: 'IGS POD US 1',
              requiresAny: ['SQL System Jobs', 'MSSQLSERVER', 'SQL Server', 'Windows SQL Events']
          },
          {
              // GCGC Does not subscribe to LVS Database Services
              includes: ['lmcollector: BLACKJACK' ],
              priortxt: 'Possible <b><u><font color="red">Database Alert</font></u>: GCGC Does not subscribe to LVS Database services.</b><br />E-mail alert to address listed in Runbook for any "<b>Database related alerts</b>" Otherwise<br/>',
              group: 'IGS POD BC 1',
              requiresAny: ['SQL System Jobs', 'SQL Server']
          },
          {
              // GCGC Does not subscribe to LVS Exchange Services
              includes: ['lmcollector: BLACKJACK' ],
              priortxt: 'Possible <b><u><font color="red">Exchange Alert</font></u>: GCGC Does not subscribe to LVS Exchange services.</b><br />E-mail alert to address listed in Runbook for any "<b>Exchange related alerts</b>" Otherwise<br/>',
              group: 'IGS POD BC 1',
              requiresAny: ['Windows Exchange Events', 'Exchange Event']
          },
          {
              // Index Exchange goes to IGS POD TO 1
              includesAny: ['casalemedia.com', 'Index Exchange' ],
              priortxt: '',
              group: 'IGS POD TO 1'
          },
          {
              // Keyera has their own IT Support, E-mail/Call Client and resolve.
              includesAny: ['KEYERA' ],
              priortxt: '',
              group: 'E-mail/Call Client and Resolve.'
          },
          {
              // Leavitt Manaul Tickets got o IGS POD BC 1
              includesAny: ['Venturis Capital Corp', 'Venturis Capital' ],
              priortxt: '',
              group: 'IGS POD BC 1'
          },
          {
              // Collector Down Alert
              includes: 'LogicMonitor system has not received any data from Collector ',
              priortxt: '',
              group: 'Collector Down Alert, Assign to appropriate POD'
          },
          {
              // No Match to anything else, confirm ticket contains "lvs.pod:" to allow script to show 'Unknown Group'
              // Otherwise no match = do not inject any of the DIVs as this may be a completely manual ticket with no alert details.
              includes: 'lvs.pod:',
              group: ''
          }
    ];


    // Debug Function to log messages to console if enabled at top of script
    function logDebug(...messages) {
        if (debugMode) {
            console.log(...messages);
        }
    }


    // Toggle the Domain Scope to allow editing of the ticket if its not an ITO ticket.
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


    // Create animation style to make it obvious that the domain scope was toggled.
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


    // Show Floating Text near the Toggle Domain Scope Button
    function showFloatingText() {
        var floatingText = document.createElement('div');
        floatingText.innerHTML = 'Domain Scope<br />Auto-Toggled';
        floatingText.className = 'floating-text';
        document.body.appendChild(floatingText);

        floatingText.style.zIndex = 1000;
        floatingText.style.animation = 'fadeInSlideDown 1s forwards';

        setTimeout(() => {
            floatingText.style.animation = 'fadeOutSlideDown 1s forwards';
            setTimeout(() => floatingText.remove(), 1000);
        }, 4500);
    }


    // Extract the Incident Description from either sys_readonly.incident.descroption (Older Closed Tickets), or incident.description (Current/New/In Progress)
    function getincidentDescription() {
        const descriptionIds = ['sys_readonly.incident.description', 'incident.description'];
        for (let id of descriptionIds) {
            let descriptionElement = document.getElementById(id);
            if (descriptionElement) {
                logDebug(`incidentDescription from ${id}:`, descriptionElement.value.trim());
                return descriptionElement;
            }
        }
        logDebug('No incidentDescription found');
        return null;
    }


    // Line Match Function
    function checkLineForMatch(line, check) {
        if (check.includes) {
            return line.includes(check.includes) ? check.includes : false;
        } else if (check.includesAny) {
            return check.includesAny.find(includeItem => line.includes(includeItem)) || false;
        }
        return false;
    }


    // Device Count Function
    function countDeviceTypes(lines) {
        let count = { Enabled: 0, Essentials: 0, Empowered: 0 };

        lines.forEach(line => {
            if (line.includes("lvs.managedservicelevel: Enabled")) count.Enabled++;
            if (line.includes("lvs.managedservicelevel: Essentials")) count.Essentials++;
            if (line.includes("lvs.managedservicelevel: Empowered")) count.Empowered++;
        });

        return count;
    }


    // Format Device Count
    function formatDeviceCount(count, type) {
        const deviceLabel = count === 1 ? 'device' : 'devices';
        const formattedType = type === "Enabled" || type === "Essentials"
        ? `<u><font color="red"><b>${count} ${type}</b></font> ${deviceLabel} detected in alert</u>`
        : `<b>${count} ${type}</b> ${deviceLabel} detected in alert`;
        return formattedType;
    }


    // Check for missing Key Critical Info
    function checkForMissingCriticalInfo(lines) {
        const criticalKeys = [
            { key: 'lvs.managedservicelevel:', label: 'Managed Service Level' },
            { key: 'lvs.supporthours:', label: 'Support Hours' },
            { key: 'lvs.supportlevel:', label: 'Support Level' }
        ];

        let missingKeys = criticalKeys.filter(({ key }) =>
                                              !lines.some(line => line.includes(key) && line.split(key)[1].trim() !== '')
                                             ).map(({ label }) => label);

        if (missingKeys.length > 0) {
            return `<br /><font color="red">Ticket is missing key critical information: <br /><b>${missingKeys.join(', ')}</b><br />Please forward ticket to Pod or Site Manager as a device in the ticket may be onboarding.</font><br /><br />`;
        }
        return '';
    }


    // Primary Process Match Function
    function processMatch(foundValue, check, line, lines) {
        // Initialize variables
        let suggestedGroupInfo = {
            text: check.priortxt + '<b>' + check.group + '</b>',
            showInVendorSection: false,
        };

        // Process pod value if present
        if (foundValue === 'lvs.pod:' && check.group === '') {
            const podValue = line.split('lvs.pod:')[1].trim();
            suggestedGroupInfo.text = podValue ? `<b>${podValue}</b>` : '<b>UNKNOWN</b>';
        }

        let currentMode = localStorage.getItem('selectedMode') || 'NOC';


        // Handle device counts
        const deviceCounts = countDeviceTypes(lines);
        let enabledDetected = deviceCounts.Enabled > 0;
        let essentialsDetected = deviceCounts.Essentials > 0;

        let deviceCountsText = '';
        Object.entries(deviceCounts).forEach(([type, count]) => {
            if (count > 0 && (type === "Enabled" || type === "Essentials")) {
                deviceCountsText += formatDeviceCount(count, type) + '<br />';
            } else if (count > 0 && type === "Empowered" && (enabledDetected || essentialsDetected)) {
                deviceCountsText += formatDeviceCount(count, type) + '<br />';
            }
        });

        // Special note for NOC mode
        let specialNoteText = '';
        if (currentMode === "NOC" && (deviceCounts.Enabled > 0 || deviceCounts.Essentials > 0)) {
            let specificDevices = [];
            if (deviceCounts.Enabled > 0) specificDevices.push("Enabled");
            if (deviceCounts.Essentials > 0) specificDevices.push("Essentials");
            let devicesText = specificDevices.join('/');
            specialNoteText = `Check for client specific runbook/escalation process for any <b><font color="red">${devicesText}</font></b> devices <b>before routing</b>.<br />`;
        }

        let missingInfoText = checkForMissingCriticalInfo(lines);
        specialNoteText = missingInfoText + specialNoteText; // Prepend any found missing info messages to the existing note

        // Combine text
        let combinedText = deviceCountsText + specialNoteText + suggestedGroupInfo.text;

        // Display logic
        if (currentMode === "NOC") {
            insertSuggestedGroupDisplay(combinedText);
        } else if (currentMode === "GSD") {
            // Do nothing for now
        } else if (currentMode === "IGS") {
            // For IGS, display device counts in a specific location, and suggested group text elsewhere without special notes
            updateDeviceCountsDisplayIGSMode(deviceCounts);
            if (suggestedGroupInfo.text) {
                insertSuggestedGroupDisplay(suggestedGroupInfo.text);
            }
        }

        return suggestedGroupInfo;
    }

    // Create and Insert Element Function
    function createAndInsertElement(tagName, attributes, innerHTML, parent, insertBefore) {
        let element = document.createElement(tagName);
        Object.keys(attributes).forEach(attr => element.setAttribute(attr, attributes[attr]));
        element.innerHTML = innerHTML;
        if (insertBefore) {
            parent.insertBefore(element, insertBefore);
        } else {
            parent.appendChild(element);
        }
        return element;
    }


    // Insert Suggested Group under Vendor Ticket field
    function insertSuggestedGroupDisplay(suggestedText) {
        //let currentMode = localStorage.getItem('selectedMode') || 'NOC';

        // Find the Vendor Ticket and Assignment Group elements
        let vendorTicketElement = document.getElementById('element.incident.u_vendor_ticket');
        let assignmentGroupElement = document.getElementById('element.incident.assignment_group');

        const assignmentGroupDiv = document.getElementById('element.incident.assignment_group');
        if (assignmentGroupDiv) {
            createAndInsertElement(
                'div',
                {class: 'form-group'},
                `<div class="col-xs-12 col-md-3 col-lg-4 control-label">
                     <label class="label-text"><b>Group suggestion</b></label>
                 </div>
                 <div class="col-xs-10 col-sm-9 col-md-6 col-lg-5 form-field input_controls">
                     <div class="form-control-static">${suggestedText}</div>
                 </div>`,
                assignmentGroupDiv.parentNode,
                assignmentGroupDiv
            );
        }

    }


    // Display Device Count for IGS mode between the Short Description and Description field for visibility
    function updateDeviceCountsDisplayIGSMode(deviceCounts) {
        // Build the innerHTML based on deviceCounts
        let countsHTML = '';
        let hasCountsToShow = false;

        // Start the container for the device count display
        let deviceCountContainerHTML = '<div class="col-xs-10 col-md-9 col-lg-8"><div class="form-control-static">';

        // Iterate through deviceCounts and build HTML for each type if count > 0
        Object.entries(deviceCounts).forEach(([type, count]) => {
            if (count > 0) {
                // Append each device type and count to the container
                deviceCountContainerHTML += `<b>${type}</b>: ${count}<br />`;
                hasCountsToShow = true;
            }
        });

        // Close the container for the device count display
        deviceCountContainerHTML += '</div></div>';

        // Only proceed if there's at least one count to show
        if (hasCountsToShow) {
            // Create or update the display element for device counts
            let shortDescriptionDiv = document.getElementById('element.incident.short_description');
            let descriptionDiv = document.getElementById('element.incident.description');
            if (shortDescriptionDiv && descriptionDiv) {
                createAndInsertElement(
                    'div',
                    {id: 'deviceCountDisplay'},
                    `<div class="row" style="margin-top: 10px;">
                         <div class="col-xs-12 col-md-1_5 col-lg-2 control-label">
                             <label class="label-text"><b>Device Count in Alert</b></label>
                         </div>
                         ${deviceCountContainerHTML}
                     </div>`,
                    shortDescriptionDiv.parentNode,
                    descriptionDiv
                );
            }
        } else {
            // If no counts to show and an existing display exists, remove it
            let existingDisplay = document.getElementById('deviceCountDisplay');
            if (existingDisplay) {
                existingDisplay.remove();
            }
        }
    }


    // Main Function to put everything together
    setTimeout(() => {

        // Mode selection dropdown creation and insertion
        var modeSelectionDiv = document.createElement('div');
        var labelNumber = document.getElementById('label.incident.number'); // Assuming this is a stable element to insert our dropdown before

        var modeSelectorText = document.createElement('span'); // Creating a span element for the text
        modeSelectorText.textContent = 'Information Mode for Team: '; // Setting the text content
        modeSelectionDiv.appendChild(modeSelectorText); // Appending the text to the mode selection div

        var modeSelector = document.createElement('select');
        modeSelector.innerHTML = `
            <option value="NOC">NOC</option>
            <option value="IGS">IGS</option>
            <option value="GSD">GSD</option>
        `;

        // Load the currently selected mode from localStorage
        // Adjust where to display based on the mode and whether a match was found
        var selectedMode = localStorage.getItem('selectedMode') || 'NOC'; // Default to 'NOC'
        modeSelector.value = selectedMode;

        // Handle mode selection changes
        modeSelector.addEventListener('change', function() {
            localStorage.setItem('selectedMode', this.value);
            // Trigger any script updates needed when mode changes
            console.log('Mode changed to:', this.value);

            // Reload the page to refresh data and views according to the new mode
            window.location.reload();
        });

        modeSelectionDiv.appendChild(modeSelector);
        // Assuming the labelNumber's parent is the desired injection point
        labelNumber.parentNode.insertBefore(modeSelectionDiv, labelNumber);

        // Additional script adjustments based on mode
        // For example, adjusting the script behavior based on the selected mode:
        switch (selectedMode) {
            case 'NOC':
                // Specific adjustments for NOC mode
                break;
            case 'GSD':
                // Specific adjustments for GSD mode
                break;
            case 'IGS':
                // Specific adjustments for IGS mode
                break;
            default:
                console.error('Unknown mode selected:', selectedMode);
        }

        addAnimationStyles();
        setTimeout(checkDomainScope, 250);

        var incidentDescription = getincidentDescription();
        const lines = incidentDescription.textContent.split('\n');

        let suggestedAssignmentGroupText = '';
        let isMatchFound = false;

        let suggestedGroupInfo = {
            text: '',
            showInVendorSection: false,
        };

        outerLoop:
        for (const check of checks) {
            if (check.requiresAny && !check.requiresAny.some(label => lines.some(line => line.includes(label)))) {
                continue;
            }

            for (const line of lines) {
                const foundValue = checkLineForMatch(line, check);
                if (foundValue) {
                    // Process the match and get suggested group information
                    suggestedGroupInfo = processMatch(foundValue, check, line, lines);
                    break outerLoop;
                }
            }
        }

        if (!suggestedGroupInfo.text) {
            // No match found, set to UNKNOWN
            suggestedGroupInfo.text = '<b>UNKNOWN</b>';
        }

    }, 250);

})();
