import {
	FileSystemAdapter,
	parseYaml,
	Plugin,
	sanitizeHTMLToDom,
} from "obsidian";
import { simpleGit } from "simple-git";
import { html, parse } from "diff2html";
import {
	createDailyDiffCodeBlock,
	createRangeArg,
	getExcludedPaths,
} from "./utils";
import lucideFileText from "../icons/lucide-file-text.svg";
import lucideFilePlus from "../icons/lucide-file-plus.svg";

const rawTemplates = {
	"icon-file": lucideFileText,
	"tag-file-added": lucideFilePlus,
	// todo
	"tag-file-changed": null,
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

	private getBasePath() {
		return (this.app.vault.adapter as FileSystemAdapter).getBasePath();
	}

	private gitDiff(config: any) {
		const args = [createRangeArg(config), "--", getExcludedPaths(config)];

		return simpleGit(this.getBasePath()).diff(args);
	}

	diffProcessor = async (rawConfig: string, el: HTMLDivElement) => {
		try {
			const config = parseYaml(rawConfig);
			const diff = await this.gitDiff(config);

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
