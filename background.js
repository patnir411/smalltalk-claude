const menuItems = ["Summarize", "ELI5", "Question"];

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		id: "textActionMenu",
		title: "Small Talk",
		contexts: ["selection"]
	});

	menuItems.forEach((item) => {
		chrome.contextMenus.create({
			id: item.toLowerCase().replace(/\s+/g, "_"), // Generate a unique id
			parentId: "textActionMenu",
			title: item,
			contexts: ["selection"]
		});
	});
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
	console.log("Context menu clicked:", info.menuItemId);
	if (menuItems.map((item) => item.toLowerCase()).includes(info.menuItemId)) {
		executeAction(tab.id, info.menuItemId);
	}
});

chrome.commands.onCommand.addListener((command, tab) => {
	console.log("Command executed:", command);
	if (["summarize", "eli5", "question"].includes(command)) {
		executeAction(tab.id, command);
	}
});

// Add this at the top of background.js
let originalTabId = null;

function executeAction(tabId, action) {
	if (action === "question") {
		// Store the original tab ID before opening popup
		originalTabId = tabId;

		// Get selection coordinates from the content script
		chrome.tabs.sendMessage(
			tabId,
			{ action: "getSelectionCoords" },
			(response) => {
				if (chrome.runtime.lastError) {
					console.error(
						"Error getting coordinates:",
						chrome.runtime.lastError.message
					);
					return;
				}

				if (response.error) {
					console.error("Error:", response.error);
					return;
				}

				const { x, y } = response;
				const width = 300;
				const height = 100;

				// Position popup above the selection
				const left = Math.round(x);
				const top = Math.round(y - height); // 10px gap above selection

				chrome.windows.create({
					url: "popup.html",
					type: "popup",
					width: width,
					height: height,
					left: left,
					top: top
				});
			}
		);
	} else {
		console.log("Executing non-question:", action);
		chrome.tabs.sendMessage(
			tabId,
			{
				action: "replaceText",
				aiAction: action,
				question: ""
			},
			(response) => {
				if (chrome.runtime.lastError) {
					console.error(
						"Error sending message:",
						chrome.runtime.lastError.message
					);
				} else {
					console.log("Message sent successfully", response);
				}
			}
		);
	}
}

// Popup listener to use the stored tabId
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "replaceText" && request.aiAction === "question") {
		console.log("Received question from popup:", request.question);
		if (originalTabId) {
			chrome.tabs.sendMessage(
				originalTabId, // Use the stored tab ID
				{
					action: "replaceText",
					aiAction: "question",
					question: request.question
				},
				(response) => {
					if (chrome.runtime.lastError) {
						console.error(
							"Error:",
							chrome.runtime.lastError.message
						);
						sendResponse({
							status: "error",
							error: chrome.runtime.lastError.message
						});
					} else {
						console.log("Message sent successfully", response);
						sendResponse({ status: "completed" });
					}
				}
			);
			return true; // Keep the message channel open
		} else {
			console.error("No original tab ID found");
			sendResponse({ status: "error", error: "No target tab found" });
		}
	}
});

function sendReplaceTextMessage(tabId, actionOrRequest) {
	const action = actionOrRequest.action || actionOrRequest;
	const question = actionOrRequest.question || "";

	console.log(`Sending message to tab ${tabId}:`, { action, question });

	// First, get the active tab
	chrome.tabs.query(
		{ active: true, currentWindow: true },
		async function (tabs) {
			if (tabs.length > 0) {
				try {
					await chrome.tabs.sendMessage(
						tabs[0].id,
						{
							action: "replaceText",
							aiAction: action,
							question: question
						},
						function (response) {
							if (chrome.runtime.lastError) {
								console.error(
									"Error:",
									chrome.runtime.lastError.message
								);
								return;
							}
							console.log("Message sent successfully", response);
						}
					);
				} catch (error) {
					console.error("Failed to send message:", error);
				}
			} else {
				console.error("No active tab found to send the message.");
			}
		}
	);
}
