import {
	App,
	FileSystemAdapter,
	parseYaml,
	Plugin,
	PluginSettingTab,
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

const DAILY_DIFF_CONFIG = {
	dates: {
		from: "2023-04-18",
		to: "2023-04-19",
	},
	exclude: ".obsidian",
};

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
				const yaml = stringifyYaml(DAILY_DIFF_CONFIG).trimEnd();
				const block = `\`\`\`render-diff\n${yaml}\n\`\`\``;
				editor.replaceSelection(block);
			},
		});
	}

	onunload() {}

	diffProcessor = async (source: string, el: HTMLDivElement) => {
		const config = parseYaml(source);
		const { from, to } = config.dates || {};

		const dateRange = `HEAD@{${from}}..HEAD@{${to}}`;

		const { from: fromCommit, to: toCommit } = config.commits || {};

		const commitRange = `${fromCommit}..${toCommit}`;

		const baseDir = (
			this.app.vault.adapter as FileSystemAdapter
		).getBasePath();

		try {
			const response = await simpleGit(baseDir).diff([
				"--ignore-all-space",
				config.dates ? dateRange : commitRange,
				"--",
				`:!${config.exclude}`,
			]);

			const parsedDiff = parse(response);
			el.innerHTML = html(parsedDiff, {
				drawFileList: false,
				rawTemplates: {
					"icon-file": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>`,
					"tag-file-added": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" x2="12" y1="18" y2="12"></line><line x1="9" x2="15" y1="15" y2="15"></line></svg>`,
				},
			});

			// new Diff2HtmlUI(el, response, {
			// 	stickyFileHeaders: false,
			// 	renderNothingWhenEmpty: true,
			// }).draw();
		} catch (e) {
			el.setText(`Error: ${e.message}`);
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
