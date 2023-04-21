import {
	App,
	FileSystemAdapter,
	moment,
	parseYaml,
	Plugin,
	PluginSettingTab,
	sanitizeHTMLToDom,
	Setting,
	stringifyYaml,
} from "obsidian";
import { simpleGit } from "simple-git";
import { html, parse } from "diff2html";

interface RenderDiffSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: RenderDiffSettings = {
	mySetting: "default",
};

function getDefaultFrom() {
	return moment().subtract(1, "day").format("YYYY-MM-DD");
}

function getDefaultTo() {
	return moment().format("YYYY-MM-DD");
}

const DAILY_DIFF_CONFIG = {
	dates: {
		from: getDefaultFrom(),
		to: getDefaultTo(),
	},
};

function createDailyDiffCodeBlock() {
	const yaml = stringifyYaml(DAILY_DIFF_CONFIG).trimEnd();
	return `\`\`\`render-diff\n${yaml}\n\`\`\``;
}

function getDateRange(from: string, to: string) {
	return `HEAD@{${from}}..HEAD@{${to}}`;
}

function getDefaultDateRange() {
	return getDateRange(getDefaultFrom(), getDefaultTo());
}

function getCommitRange(from: string, to: string) {
	return `${from}..${to}`;
}

function excludePath(string: string) {
	return `:(exclude)${string}`;
}

function createRangeArg(config: any) {
	if (!config) {
		return getDefaultDateRange();
	}

	const { commits, dates } = config;

	if (commits) {
		const { from, to } = commits;
		if (!from) {
			throw new Error("Commits must have a `from` and `to` property");
		}

		return getCommitRange(from, to);
	}

	if (dates) {
		const { from, to = getDefaultTo() } = dates;
		if (!from) {
			throw new Error("Dates must have a `from` property");
		}

		return getDateRange(from, to);
	}

	return getDefaultDateRange();
}

function getExcludedPaths(config: any) {
	if (!config) {
		return excludePath(".obsidian");
	}

	const { exclude } = config;

	if (Array.isArray(exclude)) {
		exclude.map((path: string) => excludePath(path)).join(" ");
	}

	return excludePath(exclude);
}

export default class RenderDiffPlugin extends Plugin {
	settings: RenderDiffSettings;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor(
			"render-diff",
			this.diffProcessor
		);

		this.addCommand({
			id: "generate-diff-for-today",
			name: "Generate diff for today",
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

			const parsedDiff = parse(diff);
			const sanitizedHtml = sanitizeHTMLToDom(
				html(parsedDiff, {
					drawFileList: false,
					rawTemplates: {
						"icon-file": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>`,
						"tag-file-added": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" x2="12" y1="18" y2="12"></line><line x1="9" x2="15" y1="15" y2="15"></line></svg>`,
					},
				})
			);

			el.append(sanitizedHtml);
		} catch (e) {
			el.createEl("pre", {
				text: e,
			});

			throw e;
		}
	};

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class RenderDiffSettingTab extends PluginSettingTab {
	plugin: RenderDiffPlugin;

	constructor(app: App, plugin: RenderDiffPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						console.log("Secret: " + value);
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
