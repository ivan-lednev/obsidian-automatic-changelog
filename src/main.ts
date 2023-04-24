import {
	FileSystemAdapter,
	parseYaml,
	Plugin,
	sanitizeHTMLToDom,
} from "obsidian";
import { html, parse } from "diff2html";
import { createDailyDiffCodeBlock, gitDiff } from "./utils";
import fileText from "../icons/file-text.svg";
import filePlus from "../icons/file-plus.svg";
import fileDiff from "../icons/file-diff.svg";
import fileRenamed from "../icons/file-signature.svg";
import fileX from "../icons/file-x.svg";
import plus from "../icons/plus.svg";
import diff from "../icons/diff.svg";
import trash from "../icons/trash-2.svg";

const rawTemplates = {
	"icon-file": fileText,
	"icon-file-added": filePlus,
	"icon-file-changed": fileDiff,
	"icon-file-deleted": fileX,
	"icon-file-renamed": fileRenamed,
	"tag-file-added": plus,
	"tag-file-changed": diff,
	"tag-file-deleted": trash,
	"tag-file-renamed": fileRenamed,
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
			const config = {
				path: this.getVaultPath(),
				...parseYaml(rawConfig),
			};

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
