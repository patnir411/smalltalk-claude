document.addEventListener("DOMContentLoaded", () => {
	const questionInput = document.getElementById("question");

	// Automatically focus on the input text box
	questionInput.focus();

	// Submit on Enter key press and exit on Esc key press
	questionInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			const question = questionInput.value.trim();
			if (question) {
				// Send message and close immediately
				chrome.runtime.sendMessage({
					action: "replaceText",
					aiAction: "question",
					question: question
				});
				window.close();
			}
		} else if (event.key === "Escape") {
			window.close();
		}
	});
});
