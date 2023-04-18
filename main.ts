import {
	App,
	FileSystemAdapter,
	parseYaml,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { Diff2HtmlUI } from "diff2html/lib-esm/ui/js/diff2html-ui";
import { simpleGit } from "simple-git";

interface RenderDiffSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: RenderDiffSettings = {
	mySetting: "default",
};

export default class RenderDiffPlugin extends Plugin {
	settings: RenderDiffSettings;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownCodeBlockProcessor(
			"render-diff",
			this.renderDiffProcessor
		);
	}

	onunload() {}

	renderDiffProcessor = async (source: string, el: HTMLDivElement) => {
		const config = parseYaml(source);
		const { from, to } = config.dates || {};

		const dateRange = `HEAD@{${from}}..HEAD@{${to}}`;

		const { from: fromCommit, to: toCommit } = config.commits;

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
				// todo: make an option
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
