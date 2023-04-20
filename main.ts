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
import { Diff2HtmlUI } from "diff2html/lib-esm/ui/js/diff2html-ui";

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

			new Diff2HtmlUI(el, response, {
				stickyFileHeaders: false,
				renderNothingWhenEmpty: true,
			}).draw();
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
