import {
	FileSystemAdapter,
	parseYaml,
	Plugin,
	sanitizeHTMLToDom,
} from "obsidian";
import { html, parse } from "diff2html";
import { createDailyDiffCodeBlock, gitDiff } from "./utils";
import lucideFileText from "../icons/lucide-file-text.svg";
import lucideFilePlus from "../icons/lucide-file-plus.svg";

const rawTemplates = {
	"icon-file": lucideFileText,
	"tag-file-added": lucideFilePlus,
	// todo
	"tag-file-changed": "",
};

export default class RenderDiffPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor(
			"show-diff",
			this.diffProcessor
		);

		this.addCommand({
			id: "generate-diff-for-today",
			name: "Generate diff code block for today",
			editorCallback: (editor) => {
				editor.replaceSelection(createDailyDiffCodeBlock());
			},
		});
	}

	onunload() {}

	private getVaultPath() {
		return (this.app.vault.adapter as FileSystemAdapter).getBasePath();
	}

	diffProcessor = async (rawConfig: string, el: HTMLDivElement) => {
		try {
			const config = parseYaml(rawConfig) || {};
			if (!config.path) {
				config.path = this.getVaultPath();
			}

			const diff = await gitDiff(config);

			if (!diff.trim()) {
				el.createEl("p", { text: "No changes" });
			}

			const fragment = sanitizeHTMLToDom(
				html(parse(diff), { drawFileList: false, rawTemplates })
			);

			el.append(fragment);
		} catch (e) {
			el.createEl("pre", { text: e });
		}
	};
}
