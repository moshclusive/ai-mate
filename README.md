# AI Mate — Smart Assistant for AI Chats

> A Chrome extension (Manifest V3, v2.0.0) that puts ChatGPT, Gemini, DeepSeek, and Kimi in one side panel — and lets you send any selected text to them from any web page.

## ✨ Features

- **Side panel with four AI chats** — ChatGPT, Gemini, DeepSeek, and Kimi, each in its own tab inside Chrome's side panel. The real site loads in the panel, so you stay logged in as usual.
- **Floating widget** — Select text on any web page and a small floating icon appears. Click it to open a compact panel with a prompt picker and a text box.
- **Prompt library** — Eight built-in prompts for freelance client work (Bangla summary, client message reply, explain like I'm five, improve English, translate for client, and more). Add, edit, and delete your own prompts in Settings; they sync with your Chrome account.
- **Send to AI Mate** — Right-click selected text or an image and send it straight to AI Mate.
- **Smart insertion** — When the panel is open, AI Mate finds the chat input box on the AI site and inserts your selected text, or a prompt plus the selected text, for you.
- **Keyboard shortcut** — `Alt+A` (Mac: `Cmd+Shift+A`) toggles the floating menu.

## 📥 Install

There is no installer — this is a Chrome extension you load unpacked:

1. Download this repository (Code → Download ZIP) and extract it, or clone it:
   ```bash
   git clone https://github.com/moshclusive/ai-mate.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `ai-mate` folder.
5. Click the AI Mate icon in the toolbar, or press `Alt+A` on any page.

Requires Chrome 114 or newer.

## 🖥️ How to Use

1. **Side panel:** Open the side panel from the toolbar icon and pick a chat (ChatGPT / Gemini / DeepSeek / Kimi). Log in on the site as you normally would.
2. **From any page:** Select text, click the floating icon, pick a prompt (for example "Simplify Client's Message"), and the text is sent into the AI chat input.
3. **Prompts:** Open Settings from the popup to add your own prompts. Prompts are stored in your own Chrome sync storage.

## 🔒 Privacy

- AI Mate does not run its own server and does not collect your data. Prompts live in your Chrome sync storage.
- To load the AI sites inside the side panel, the extension removes the sites' frame-blocking response headers (`X-Frame-Options`, `Frame-Options`, `Content-Security-Policy`) for those sites only, using one `declarativeNetRequest` rule (`rules.json`). That is the core trick that makes the panel work — and it means the extension needs broad host access (`<all_urls>`) for its content script.
- The AI sites' own terms of service and login still apply. AI Mate is not affiliated with OpenAI, Google, DeepSeek, or Moonshot.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to fork, fix, and open a pull request.

## 📄 License

Source-available under the **PolyForm Noncommercial License 1.0.0** — free for personal, non-commercial use. You may use it, share it, and contribute improvements, but you may **not** sell it or claim it as your own. See [LICENSE](LICENSE).

## 👤 Author

**Moshiur Rahman ([@moshclusive](https://github.com/moshclusive))** — Graphic Designer, Fiverr Level 2 Seller, tool builder.

- Fiverr: https://www.fiverr.com/moshclusive
- LinkedIn: https://www.linkedin.com/in/moshclusive/
