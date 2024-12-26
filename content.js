// Utility functions
function parseMarkdown(text) {
	console.log("Parsing markdown text:", text);
	return text
		.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
		.replace(/\*(.*?)\*/g, "<em>$1</em>")
		.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
		.replace(/\n/g, "<br>");
}

function findFirstTextNode(element) {
	console.log("Finding first text node in element:", element);
	if (
		element.nodeType === Node.TEXT_NODE &&
		element.textContent.trim() !== ""
	) {
		console.log("Text node found:", element);
		return element;
	}
	for (let child of element.childNodes) {
		const textNode = findFirstTextNode(child);
		if (textNode) return textNode;
	}
	return null;
}

function restoreOriginalContent(event, originalContents) {
	console.log("Restoring original content for event:", event);
	const div = event.target.closest("div[id^='extension-replaced-']");
	if (div && div.id in originalContents) {
		const originalContent = originalContents[div.id];
		console.log("Original content found:", originalContent);

		const temp = document.createElement("div");
		temp.innerHTML = originalContent.html;

		const parent = div.parentNode;
		while (temp.firstChild) {
			parent.insertBefore(temp.firstChild, div);
		}
		parent.removeChild(div);

		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(originalContent.range);

		delete originalContents[div.id];
		console.log("Original content restored and removed from cache.");
	}
}

async function performAIAction(action, text, contentDiv, question) {
	console.log(
		"Performing AI action:",
		action,
		"with text:",
		text,
		"and question:",
		question
	);
	let prompt;

	action = action.toLowerCase();

	if (action === "summarize") {
		prompt = `Summarize the following text very concisely in a few sentences:\n\n${text}`;
	} else if (action === "eli5") {
		prompt = `Explain the following text like I'm 5 years old in a few sentences:\n\n${text}`;
	} else if (action === "question") {
		prompt = `Based on the following content, answer the question:\n\nContent: ${text}\nQuestion: ${question}`;
	} else {
		throw new Error("Unknown action: " + action);
	}

	console.log("Sending request to AI API with prompt:", prompt);
	const response = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"x-api-key": CONFIG.API_KEY,
			"anthropic-version": "2023-06-01",
			"content-type": "application/json",
			"anthropic-dangerous-direct-browser-access": "true"
		},
		body: JSON.stringify({
			model: "claude-3-5-haiku-20241022",
			max_tokens: 1024,
			messages: [
				{
					role: "user",
					content: prompt
				}
			]
		})
	});

	const data = await response.json();
	const result = data.content[0].text;
	console.log("AI response received:", result);

	contentDiv.innerHTML = parseMarkdown(result);
}

function handleReplaceText(aiAction, originalContents, question) {
	const selection = window.getSelection();
	if (selection.rangeCount > 0) {
		const originalRange = selection.getRangeAt(0).cloneRange();
		const tempDiv = document.createElement("div");
		tempDiv.appendChild(originalRange.cloneContents());
		const originalHTML = tempDiv.innerHTML;

		const firstTextNode = findFirstTextNode(tempDiv);
		let originalStyles = null;
		if (firstTextNode && firstTextNode.parentElement) {
			originalStyles = window.getComputedStyle(
				firstTextNode.parentElement
			);
		}

		const uniqueId = "extension-replaced-" + Date.now();
		originalContents[uniqueId] = {
			html: originalHTML,
			range: originalRange,
			styles: originalStyles
		};

		const div = createReplacementDiv(uniqueId, aiAction, originalStyles);
		const contentDiv = div.querySelector(".content");

		originalRange.deleteContents();
		originalRange.insertNode(div);
		selection.removeAllRanges();

		performAIAction(aiAction, tempDiv.textContent, contentDiv, question);
	}
}

function createReplacementDiv(uniqueId, aiAction, originalStyles) {
	console.log("Creating replacement div with ID:", uniqueId);
	const div = document.createElement("div");
	div.id = uniqueId;
	div.className = "extension-replaced";
	div.style.cssText = `
        cursor: pointer;
        background-color: ${
			aiAction.toLowerCase() === "eli5"
				? "#FFE5B4"
				: aiAction.toLowerCase() === "summarize"
				? "#e0f7e0"
				: aiAction.toLowerCase() === "question"
				? "#d3d3f7"
				: "#ffffff"
		};
        padding: 20px 10px 10px 10px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        margin: 5px 0;
        position: relative;
      `;

	const label = document.createElement("div");
	label.textContent = aiAction.toUpperCase();
	label.style.cssText = `
        position: absolute;
        top: 5px;
        left: 10px;
        font-size: 10px;
        color: #888;
        font-weight: bold;
      `;

	const contentDiv = document.createElement("div");
	contentDiv.className = "content";
	contentDiv.textContent = "Loading...";
	if (originalStyles) {
		contentDiv.style.cssText = `
          font: ${originalStyles.font};
          color: black;
          text-align: ${originalStyles.textAlign};
          line-height: ${originalStyles.lineHeight};
          letter-spacing: ${originalStyles.letterSpacing};
          text-indent: ${originalStyles.textIndent};
        `;
		console.log("Applied original styles to content div.");
	}

	div.appendChild(label);
	div.appendChild(contentDiv);

	return div;
}

// Main execution
const originalContents = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	console.log("Received message:", request);
	if (request.action === "getSelectionCoords") {
		const selection = window.getSelection();
		if (selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();

			// Convert coordinates to screen position
			const x = rect.left + window.screenX;
			const y = rect.top + window.screenY;

			sendResponse({ x, y });
		} else {
			sendResponse({ error: "No selection found" });
		}
		return true;
	}
	sendResponse({ status: "ready" });
	if (request.action === "replaceText") {
		try {
			const question = request.question || "";
			console.log("Processing action with question:", question);
			handleReplaceText(request.aiAction, originalContents, question);
			sendResponse({ success: true });
		} catch (error) {
			console.error("Error handling text replacement:", error);
			sendResponse({ success: false, error: error.message });
		}
		return true;
	}
});

console.log("Content script loaded");
