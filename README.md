# Small Talk with Claude

Small Talk with Claude is a Chrome extension that uses Claude AI to help you understand text better. Simply highlight any text on a webpage and use the extension to:

→ Summarize highlighted text (**Cmd+Shift+S**)

→ Explain content as if you're 5 years old (**Cmd+Shift+E**)

→ Ask questions about the selected text (**Cmd+Shift+P**)

## Features

-   **Context Menu**: Right-click any selected text to access Small Talk features
-   **Keyboard Shortcuts**: Quick access with keyboard commands
-   **Interactive UI**: Clean, minimal interface for asking questions
-   **Smart Formatting**: Preserves original text styling while showing AI responses
-   **Markdown Support**: Responses support bold, italic, links, and line breaks

## Configuration

Before using the extension:

1. Create a `config.js` file in the root directory
2. Add your Claude API key:

```javascript
const CONFIG = {
	API_KEY: "your-anthropic-api-key-here"
};
```

## Installation

1. Clone this repository
2. Add your API key as described above
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extension directory

## Keyboard Shortcuts

-   **Cmd+Shift+S** (Mac) / **Ctrl+Shift+S** (Windows): Summarize text
-   **Cmd+Shift+E** (Mac) / **Ctrl+Shift+E** (Windows): Explain like I'm 5
-   **Cmd+Shift+P** (Mac) / **Ctrl+Shift+P** (Windows): Ask a question

## Usage

1. Select any text on a webpage
2. Either:
    - Right-click and choose an option from the Small Talk menu
    - Use a keyboard shortcut
    - Click the extension icon and type a question
3. View the AI-generated response right on the page
4. Click the response to restore the original text

## Privacy Note

This extension sends selected text to Claude's API for processing. Please be mindful of sharing sensitive information.
