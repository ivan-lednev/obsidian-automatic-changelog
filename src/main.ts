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

	private getDiff(source: string) {
		const config = parseYaml(source);

		return simpleGit(this.getBasePath()).diff([
			createRangeArg(config),
			"--",
			getExcludedPaths(config),
		]);
	}

	diffProcessor = async (source: string, el: HTMLDivElement) => {
		try {
			const diff = await this.getDiff(source);

			if (!diff.trim()) {
				el.createEl("p", { text: "No changes" });
			}

			el.append(
				sanitizeHTMLToDom(
					html(parse(diff), { drawFileList: false, rawTemplates })
				)
			);
		} catch (e) {
			el.createEl("pre", {
				text: e,
			});
		}
	};
}
